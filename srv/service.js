const cds = require ('@sap/cds');

module.exports = cds.service.impl(async function () {
    
    //Extraccion de las entidades locales 
    const {Stock, CustomerCredit, ProductPricing } = this.entities;

    // Conexion con los servicios remoto registrado en package,json
    const bupa = await cds.connect.to('API_BUSINESS_PARTNER');
    const prod = await cds.connect.to('API_PRODUCT_SRV');

    // Manejador de lectura para la entidad Customer
    this.on('READ', 'Customer', async (req)=>{
        //Delega la consulta OData tal cual hacia S/4HANA
        const result =  await bupa.run (req.query)
        if (Array.isArray (result)){
            return result.filter (p=> p.customerNumber !== '');
        }
        return result;
    });

    //Se encarga de la lectura para la entidad Product
    this.on('READ', 'Product', async (req)=>{
        const result = await prod.run(req.query);
        const allowedTypes = ['MAT', 'FERT', 'HAWA'];
        if (Array.isArray(result)){
            return result.filter (p => allowedTypes.includes (p.type));
        }
        return result;
    });

    //Logica de calculo y stock
    this.before ('CREATE', 'Order', async (req) => {
        //Sacamos los datos que nos llego 
        const order= req.data;

        //Validar clientes
        if (!order.customer){
            req.error (400, `Debe indicar un cliente.`);
            return;
        }

        const customer = await bupa.run (
            SELECT.one.from ('A_BusinessPartner').where ({BusinessPartner:order.customer})
        )

        if (!customer || !customer.Customer || customer.Customer.trim() === ''){
            req.error (404, `El cliente ${order.customer} no es valido.`);
            return;
        }
        
        //Verificamos si es que items llego vacio 
        if (!order.items || order.items.length === 0){
            req.error (400,`La orden debe contener al menos un producto. `);
            return;
        }
        //Variable que guarda el subtotal de cada producto y el impuesto
        let totalNet = 0;
        let totalTax = 0;

        //Preocesamos los items 
        for (const item of order.items) {

            const product = await prod.run (
                SELECT.one.from ('A_Product').where ({Product: item.product})
            );

            //Verificamos que sea un producto comerciable
            const allowedTypes = ['MAT', 'FERT', 'HAWA'];
            if (!product || !allowedTypes.includes (product.ProductType)){
                req.error (400, `El producto ${item.product} no existe o no se puede vender`);
                return;
            }

            //Realiza la consulta a la base de datos de stock
            const currentStock = await SELECT.one.from (Stock).where ({
                product: item.product,
                warehouse_ID: item.warehouse_ID
            });

            //Verificamos que exista el producto sino lanzamos un error 
            if (!currentStock || currentStock.quantity < item.quantity ){
                req.error (400, `Stock insuficiente para el producto ${item.product}`);
                return;
            }

            const pricing = await SELECT.one.from (ProductPricing).where ({
                product: item.product
            });

            //Verifica si hay precio asociado al producto
            if (!pricing){
                req.error (400, `No hay precio configurado para el producto ${item.product}`)
                return;
            }

            //Asignacion de valores oficiales al catalogo
            item.unitPrice = pricing.unitPrice;
            item.taxRate = pricing.taxRate;
            
            //realizamos los calculos 
            const itemNet = (item.quantity || 0) * (item.unitPrice || 0);
            const itemTax = Math.round(itemNet * (item.taxRate/ 100)* 100)/100;
            
            //Asignamos los valores dentro de la tabla.
            item.netAmount = itemNet;
            item.taxAmount = itemTax;
            item.grossAmount = itemNet + itemTax;

            totalNet += itemNet;
            totalTax += itemTax;
        }

        //Totales de cabecera
        order.netAmount = totalNet;               //Total neto de la order 
        order.taxAmount = totalTax;               //impuesto (en este caso 10%)
        order.grossAmount= totalNet + totalTax;   //Importe bruto final 


        //Validamos el credito
        const credit = await SELECT.one.from (CustomerCredit).where ({
            customer: order.customer
        });

        if (!credit){
            req.error (400, `No hay datos de credito para el cliente ${order.customer}`)
            return;
        }

        //
        const available = credit.creditLimit - credit.creditUsed;
        if (order.grossAmount > available){
            req.error (400, `Credito insuficiente. Disponible: ${available}, Total del pedido ${order.grossAmount}`);
            return;
        }
        order.status = 'validated';
    });

    //Realizamos el descuento del stock del propducto 
    this.after ('CREATE', 'Order', async (_, req) => {
        const order = req.data;

        for (const item of order.items){
            await UPDATE (Stock)
                .set({ quantity: {'-=': item.quantity } })
                .where ({
                    product: item.product,
                    warehouse_ID: item.warehouse_ID
                });
        }
            await UPDATE(CustomerCredit)
                .set ({creditUsed: {'+=': order.grossAmount } })
                .where ({
                    customer: order.customer
                });
    });

});