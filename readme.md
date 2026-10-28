# Sistema de Preventas con SAP CAP y SAP Fiori Elements

Aplicación transaccional desarrollada con **SAP Cloud Application Programming Model (CAP)** en Node.js y **SAP Fiori Elements**, diseñada para la captura y consulta de órdenes de preventa e integrada de forma *side-by-side* con APIs de SAP S/4HANA Sandbox.

---

## Características del Proyecto

- **Backend OData V4:** Implementado sobre `@sap/cds` exponiendo entidades transaccionales (`Order`, `OrderItem`, etc.).
- **Persistencia local:** Base de datos relacional basada en **SQLite** para desarrollo y pruebas.
- **Frontend Fiori Elements:** Generado con plantilla *List Report / Object Page* consumiendo los servicios del catálogo local.
- **Integración con SAP S/4HANA Cloud (Sandbox):** Consumo remoto de:
  - `API_BUSINESS_PARTNER`: Consulta de datos maestros de clientes.
  - `API_PRODUCT_SRV`: Consulta de catálogo y especificaciones de materiales/productos.
- **Seguridad de credenciales:** Externalización de tokens y API keys vía variables de entorno (`.env`), evitando el almacenamiento de secretos en el control de versiones.

---

## Estructura del Repositorio

```text
├── app/
│   ├── preventasorders/     # Aplicación SAP Fiori Elements (UI5)
│   └── services.cds         # Referencias de anotaciones y servicios para UI
├── db/
│   └── schema.cds           # Definición del modelo de datos de persistencia
├── srv/
│   ├── service.cds          # Definición del servicio CatalogService (OData V4)
│   ├── service.js           # Implementación de lógica de negocio y llamadas remotas
│   └── external/            # Especificaciones importadas de S/4HANA (APIs externas)
├── .env.example             # Plantilla para variables de entorno locales
├── .gitignore               # Configuración de exclusión para Git
├── package.json             # Dependencias, perfiles CDS y scripts de ejecución
└── README.md
