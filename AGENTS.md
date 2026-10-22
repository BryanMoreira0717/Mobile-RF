# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Restrição de alterações

Neste projeto, você não pode alterar nenhuma linha de código. A única exceção é o arquivo `AGENTS.md`, que pode ser atualizado.

# Project context

The user's name is Bryan Miguel Moreira. On Trello, his username is `bryanmiguelmoreira`, and his task cards may use the abbreviated name `Bryan M.`.

Sprint 1 is complete according to the user. Sprint 2 context was read from the TCC - SENAI board on 2026-10-08. Recheck live card statuses before treating this snapshot as current.

# Contexto deste chat

- A partir de 2026-10-22, o trabalho neste chat está focado nas páginas de empresa. Quando Bryan executar `aicoment` ou `/aicoment` neste chat, usar o card de empresas no Trello como destino. Esta orientação vale especificamente para este chat; confirmar o card correspondente no Trello ao executar o comando.

# Backend integration context

Inspected backend source and database schema on 2026-10-22 at `C:/Users/bryan/Desktop/backend-RF`. These notes describe checked-in source, not a verified running API or live database. Recheck the relevant contracts before future integrations. The code-edit restriction above still applies.

## Roles and shared screens

- Source of truth: `backend-RF/src/mysql-init/RFScript.sql`, table `user`, column `role`: `ENUM('user','company','admin') NOT NULL`. The same three values appear in `src/controllers/userController.js` as `VALID_ROLES`.
- UI labels: `user` = `Comprador / Artesão`; `company` = `Empresa / Fornecedor`; `admin` = `Administrador`. `comprador`, `empresa` and `visitante` are mobile navbar stages, not database roles.
- The requested profile subtitle must explicitly distinguish all three roles with ternary conditions; missing or unknown roles must not default to administrator. At inspection, `src/pages/profileScreen/profileScreen.js` only shows the company label. This code change remains pending under the edit restriction.
- Profile and dashboard wait for user loading and handle a missing user before accessing `user.role`. Apply the same pattern to other shared screens. AsyncStorage reads are asynchronous; initial `user = null` does not mean the database role is null.
- At inspection, MapScreen selects navbars by role but lacks loading/missing-user guards and uses `ativo="perfil"` in both navbars; the active map item should be `mapa`.
- Company navbar handlers in profile and map send `anuncios` to HistoryScreen, whose navbar is fixed to `comprador`. Resolve that route/role mismatch when making these pages functional. Dashboard also serves both company and user accounts; do not assume map and profile are the only shared screens. Admin navigation requires an explicit product decision; current NavBar has no admin stage.

## Authentication and profile contracts

- API prefix: `/api/reaproveitafranca` (`backend-RF/src/index.js`). Mobile `src/services/axios.js` contains the configured base URL; verify the reachable host rather than persisting a development IP here.
- `POST /user/login` accepts `{ email, password }` and returns `{ message, token, user, mustChangePassword }`. The password-login `user` contains only `id`, `role`, `name`, `status`; it does not include email, cellphone, birthday, photo or address. See `src/controllers/userController.js`, `loginUser`.
- JWT contains `id`, `role`, `name` and expires in 8 hours. Send `Authorization: Bearer <token>`; `verifyJWT` populates `req.userId`, `req.role`, `req.userName`. Backend authorization is separate from navbar visibility.
- Mobile login saves the returned object as `@user` and token as `@token` in AsyncStorage. This is a session snapshot, not a complete or automatically refreshed profile. The Axios request interceptor attaches `@token`; the service currently exports registration/login/OTP methods rather than the raw Axios client.
- `GET /user/:id` requires JWT and owner/admin access, returning a flat object: `id`, `role`, `name`, `email`, `cellphone`, `birthday`, `status`, `createdIn`. It does not return photo or address.
- `PUT /user/:id` requires owner/admin access and accepts `name`, `cellphone`, `birthday`, and optional multipart `photo`. Role, status, email and password are ignored by this update route. Its response is `{ message, user }`, with the same selected fields as GET; do not replace a complete cached profile with a partial response blindly.
- Profile photo is stored as `LONGBLOB` in the schema, not as an image URL. No photo retrieval endpoint was found in the inspected user routes; do not assume the login response supplies a usable image URI.
- Account statuses are `inactive`, `firstLogin`, `awaitingForEmail`, `active`. Password login accepts active/firstLogin accounts; `mustChangePassword` signals first access. Password routes: `PATCH /user/password`, `PATCH /user/password/first-access`, `POST /user/password/forgot`, `POST /user/password/reset`.
- Registrations: `POST /user/create` (user), `POST /user/create/empresa` (company), `POST /user/create/admin` (JWT + admin). Public registration strips the supplied role. OTP routes: `POST /otp/enviar` and `POST /otp/verificar`.

## Database and functional-page boundaries

- MySQL schema: `Reaproveita_Franca`; UUID primary keys stored as `BINARY(16)`, converted at API boundaries with UUID helpers / `BIN_TO_UUID`.
- `localization` stores addresses linked by `id_user`: `zip_code`, `street`, `neighborhood`, `number`, `city`, `state`. Schema has no latitude/longitude columns. Its service accepts `userId` and `zipCode` (camelCase), plus the other address fields. The inspected localization router exposes only `POST /localization/`; profile address retrieval and map coordinates need a confirmed backend contract.
- `product` belongs to a user and localization; statuses: `available`, `reserved`, `unavailable`; negotiation types: `sale`, `donation`. Schema requires a price for sale and NULL price for donation. `product_photo` stores product media separately.
- Product routes: public `GET /product/` and `GET /product/:id`; JWT-protected `POST /product/create`, `PUT /product/:id`, `DELETE /product/:id`. Product creation uses authenticated `req.userId` as owner. Do not infer company-only enforcement solely from the mobile UI.
- Other schema entities include `shopping`, `shopping_product`, `payment`, `card`, `commission`, `conversation`, `message`, `dispute`, `review`, `environmental_impact`, `notification`, `otp`, `log`. Table existence does not establish a usable mobile API: the inspected API router only mounts user, localization, otp, product and log routes; sockets are wired separately.
- Map companies and history transactions are currently example data. Before making a page functional, inspect the actual route/controller/service response, loading/error/empty states and role handling; do not invent endpoints or treat cached login fields as a full database record.
