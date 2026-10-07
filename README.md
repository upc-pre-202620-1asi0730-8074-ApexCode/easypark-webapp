# EasyPark Web Application

Frontend of EasyPark, a real-time parking management platform for drivers and parking operators. It is built with Vue 3, Vite, Pinia, Vue Router, Vue I18n, Axios and PrimeVue, and is organized by bounded context following Domain-Driven Design.

## Bounded contexts

| Folder | Bounded context | Status |
|---|---|---|
| `src/iam` | Identity and Access Management | Sign in, sign up, sign out, change password, route guard and bearer token interceptor |
| `src/profiles` | Profiles and Vehicles | My profile view, personal data and vehicle registration |
| `src/shared` | Shared kernel | HTTP client, layout, language switcher and common views |

Each bounded context is split into `domain/model`, `application`, `infrastructure` and `presentation`.

## Run locally

```bash
npm install
npm run fake-api
npm run dev
```

The fake API runs on `http://localhost:3000/api/v1` with json-server. `server/authentication.cjs` emulates the authentication endpoints (`/authentication/sign-in`, `/authentication/sign-up` and `/authentication/password`) and hides the user accounts collection, which stores password hashes.

## Test accounts

| Role | E-mail | Password |
|---|---|---|
| Driver | camila.soto@gmail.com | Easypark123 |
| Administrator | diego.ramos@easypark.pe | Easypark123 |

The PrimeUI license key is read from `VITE_PRIME_UI_LICENSE_KEY`.
