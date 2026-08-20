# Despliegue de la API privada del portal

Esta Lambda concentra el acceso a MySQL y las operaciones administrativas del
portal. Amplify conserva el inicio de sesión con Cognito, pero deja de conectarse
directamente a la base de datos: sus rutas reenvían las solicitudes a API
Gateway con el access token del usuario.

## 1. Construir el ZIP

Desde la raíz del proyecto:

```bash
npm ci
npm run build:lambda
cd lambda/dist
zip portal-api-lambda.zip index.cjs
```

El ZIP debe contener `index.cjs` directamente en la raíz. El handler es
`index.handler`.

## 2. Crear el rol IAM

En IAM > Roles > Create role:

1. Trusted entity: **AWS service**; use case: **Lambda**.
2. Agregar `AWSLambdaBasicExecutionRole` y
   `AWSLambdaVPCAccessExecutionRole`.
3. Nombrar el rol `campaign-file-portal-api-role`.
4. Agregar esta política inline, reemplazando todos los marcadores:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ManagePortalUsers",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminAddUserToGroup",
        "cognito-idp:AdminRemoveUserFromGroup",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminUserGlobalSignOut"
      ],
      "Resource": "arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/USER_POOL_ID"
    },
    {
      "Sid": "TemporaryCsvObjects",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload"
      ],
      "Resource": "arn:aws:s3:::BUCKET_NAME/temporary/*"
    },
    {
      "Sid": "SubmitCsvJobs",
      "Effect": "Allow",
      "Action": "batch:SubmitJob",
      "Resource": ["BATCH_JOB_QUEUE_ARN", "BATCH_JOB_DEFINITION_ARN"]
    },
    {
      "Sid": "UseUploadKey",
      "Effect": "Allow",
      "Action": ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": "KMS_KEY_ARN"
    }
  ]
}
```

Si no se usa una clave KMS propia, eliminar el último statement.

## 3. Crear la Lambda

En Lambda > Create function:

1. **Author from scratch**; nombre `campaign-file-portal-api`.
2. Runtime **Node.js 22.x**, arquitectura **x86_64**.
3. Usar el rol `campaign-file-portal-api-role`.
4. Cargar `portal-api-lambda.zip`.
5. Runtime settings > Handler: `index.handler`.
6. Comenzar con **1024 MB** y **30 segundos**.

Agregar estas variables:

```text
REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://main.xxxxxxxxx.amplifyapp.com
DB_HOST=IP_PRIVADA_O_DNS_DE_MYSQL
DB_PORT=3306
DB_NAME=NOMBRE_BASE_CENTRAL
DB_USER=usuario_portal
DB_PASSWORD=contraseña
UPLOADS_S3_BUCKET=nombre-bucket-privado
UPLOADS_KMS_KEY_ID=arn:aws:kms:...
UPLOADS_BATCH_JOB_QUEUE=arn:aws:batch:...
UPLOADS_BATCH_JOB_DEFINITION=arn:aws:batch:...
API_BASE_PATH=/portal-api
```

`API_BASE_PATH` debe coincidir con el prefijo de API Gateway. Conviene mover
`DB_PASSWORD` y `COGNITO_CLIENT_SECRET` a Secrets Manager después de validar el
primer despliegue.

## 4. Conectar la Lambda a la VPC de MySQL

En Lambda > Configuration > VPC:

1. Elegir la misma VPC de la EC2 que hospeda MySQL.
2. Elegir al menos dos subredes privadas de distintas zonas.
3. Crear o elegir `sg-portal-api-lambda`.
4. En el security group de EC2/MySQL permitir TCP 3306 únicamente desde
   `sg-portal-api-lambda`.
5. En el grupo de Lambda permitir salida 3306 hacia MySQL y 443 hacia los
   endpoints VPC.

No abrir MySQL a `0.0.0.0/0` ni usar la IP pública de la EC2.

## 5. Endpoints VPC para trabajar sin NAT

En VPC > Endpoints > Create endpoint, usando la misma VPC:

1. **S3 gateway endpoint**: `com.amazonaws.REGION.s3`. Asociarlo a las tablas
   de rutas de las subredes privadas.
2. **Batch interface endpoint**: `com.amazonaws.REGION.batch`. Elegir las
   subredes privadas, activar Private DNS y permitir HTTPS 443 desde el security
   group de Lambda.
3. **Cognito user pools interface endpoint**:
   `com.amazonaws.REGION.cognito-idp`, con Private DNS y la misma regla 443.

La Lambda solo llama `SubmitJob`; la conectividad propia del entorno Batch se
configura por separado.

## 6. Configurar API Gateway

### REST API

1. En el API existente, crear un authorizer tipo **Cognito**, con el mismo user
   pool y token source `Authorization`.
2. Crear `/portal-api/{proxy+}` con método `ANY`, integración Lambda proxy y la
   función `campaign-file-portal-api`.
3. Asociar el authorizer Cognito a `ANY`.
4. Crear también `ANY /portal-api` con la misma integración y autorización.
5. Deploy API al stage de producción.

### HTTP API

1. Crear un JWT authorizer cuyo issuer sea
   `https://cognito-idp.REGION.amazonaws.com/USER_POOL_ID` y cuya audience sea
   el app client ID.
2. Crear `ANY /portal-api/{proxy+}`, integrar la Lambda, asociar el authorizer y
   desplegar el stage.

La Lambda exige la claim `sub` validada por el authorizer. Una invocación directa
sin ese contexto responde 401 aunque incluya un Bearer ficticio.

## 7. Configurar Amplify

Agregar en Amplify > App settings > Environment variables:

```text
PORTAL_API_URL=https://API_ID.execute-api.us-east-1.amazonaws.com/STAGE/portal-api
```

Conservar las variables de login (`REGION`, Cognito y `NEXT_PUBLIC_APP_URL`).
Después de publicar esta versión, retirar de Amplify `DB_HOST`, `DB_PORT`,
`DB_NAME`, `DB_USER` y `DB_PASSWORD`: solo Lambda y worker deben tenerlas.
Ejecutar un nuevo deploy de Amplify después del cambio.

## 8. CORS del bucket para multipart

El navegador carga cada parte directamente a una URL prefirmada. En S3 > bucket
> Permissions > CORS configurar el dominio exacto de Amplify:

```json
[
  {
    "AllowedOrigins": ["https://main.xxxxxxxxx.amplifyapp.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

No agregar `GET`, no usar `*` como origen en producción y mantener Block Public
Access habilitado.

## 9. Pruebas en orden

1. Invocar `/health` directamente como evento proxy; debe responder 200 si
   MySQL es accesible y no revela detalles de conexión.
2. Desde API Gateway, usar un access token real en `GET /portal-api/me`.
3. Abrir `/portal` en Amplify; ya no debe aparecer `ETIMEDOUT`.
4. Probar clientes, campañas y esquema de campaña.
5. Probar un CSV pequeño antes de la prueba de 120 MB.
6. Revisar CloudWatch Logs y confirmar que no se imprimen tokens, contraseñas ni
   valores CSV.

## Diagnóstico rápido

- **API Gateway 401/403**: revisar authorizer, tipo de token, issuer y audience.
- **Lambda `ETIMEDOUT` a MySQL**: revisar DNS/IP privada, subredes y security
  groups; verificar que MySQL escuche en la interfaz privada.
- **Timeout hacia Cognito/S3/Batch**: revisar endpoints, Private DNS, puerto 443
  y políticas IAM.
- **Amplify sigue intentando MySQL**: confirmar el nuevo deploy y que
  `PORTAL_API_URL` exista en build y runtime.
- **S3 devuelve CORS**: revisar dominio exacto, método PUT y `ExposeHeaders` con
  `ETag`.
