namespace infocenter.preventas;

using { Currency, managed } from '@sap/cds/common';

//Preventista toma los pedidos de los clientes
entity SaleRep {
    key ID  :UUID;          //Identificador unico
    name    :String(100);   //Nombre del preventista 
}

//Representa los depositos fisicos
entity Warehouse {
    key ID  : UUID;             //Identificador unico 
    name    : String (100);     //Nombre del almacen 
    location: String (200);     //Direccion del almacen
}   

//Controla las unidades de cada producto en cada deposito
entity stock {
    key product     : String(20);               //Codigo del producto
    key warehouse   : Association to Warehouse; //FK que apunta al deposito donde se encuentra el producto
        quantity    : Integer;                  //Cantidad de unidades fisicas disponibles
}

//Representa los datos generales del pedido (generado por el preventista)
entity Order {
    key ID          : UUID;                                                 //Identificador unico
        orderDate   : Date @cds.on.insert: $now;                                                 //Fecha en la que se toma el pedido 
        customer    : String(10);                                           //Codigo identificador del cliente (viene del ERP)
        salesRep    : Association to SaleRep;                               //Relacion con el preventista responsable de la venta
        currency    : String (10) default 'PYG';                            //Moneda de la transaccion
        status      : String (20) default 'Draft';                          //Estado del pedido 
        netAmount   : Decimal (15, 2);                                      //Importe neto total de la orden (sin impuesto)
        taxAmount   : Decimal (15, 2);                                      //Importe total del IVA liquidado para todo el pedido
        grossAmount : Decimal (15, 2);                                      //Importe total final bruto
        items       : Composition of many OrderItem on items.order = $self; //Vincula este pedido con todas sus lineas individuales de productos 
                                                    
}

//Representa cada producto especifico cargado dentro de un pedido
entity OrderItem {
    key ID          : UUID;                         //Identificador unico
        order       : Association to Order;         //FK que almacena a que pedido padre pertenece esta linea
        product     : String (20);                 //Codigo del producto seleccionado por el preventista(llega del ERP)
        warehouse   : Association to Warehouse;     //Deposito desde el cual se despacha el pedido
        quantity    : Integer;                      //Cantidad de unidades solicitadas
        unitPrice   : Decimal (15,2);               //Precio unitario de venta del producto
        taxRate     : Decimal (5, 2);               //Tasa impositiva aplicable segun el regimen tributario
        netAmount   : Decimal (15, 2);              //Subtotal neto de este item (quantity * unitprice)
        taxAmount   : Decimal (15, 2);              //Monto IVA correspondiente a esta linea (netAmount * taxRate)
        grossAmount : Decimal (15, 2);              //Total final de la linea impuesto incluido (netAmount + taxAmount)
}


entity CustomerCredit {
    key customer    : String (10);
        creditLimit : Decimal (15, 2);
        creditUsed  : Decimal (15, 2);
        currency    : String (4) default 'PYG';
        }

entity ProductPricing {
    key product     : String (18);
        unitPrice   : Decimal (15, 2);
        currency    : String (3) default 'PYG';
        taxRate     : Decimal (5, 2); // 10% o 5% en Paraguay
}

