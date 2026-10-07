using { infocenter.preventas as my } from '../db/schema';

using { API_BUSINESS_PARTNER as bupa } from './external/API_BUSINESS_PARTNER';

using { API_PRODUCT_SRV as productApi } from './external/API_PRODUCT_SRV';

service CatalogService {

    //Entidades locales persistidas en DB
    entity  SaleRep         as projection on my.SaleRep;
    entity  Warehouse       as projection on my.Warehouse;
    entity  Stock           as projection on my.stock;
    entity  Order           as projection on my.Order;
    entity  OrderItem       as projection on my.OrderItem;
    entity CustomerCredit   as projection on my.CustomerCredit;
    entity ProductPricing   as projection on my.ProductPricing;

    //Proyeccion sobre el servicio remoto de S/4HANA (solo lectura)
    @readonly
    entity Customer                 as projection on bupa.A_BusinessPartner {
        key BusinessPartner         as ID,
            BusinessPartnerFullName as name,
            SearchTerm1             as searchTerm,
            Customer                as customerNumber
    };

    @readonly
    entity Product                                              as projection on productApi.A_Product {
        key Product                                             as ID,
            ProductType                                         as type,
            BaseUnit                                            as baseUnit
    };
}
