# Cryptographic Auth Tasks

- `[x]` Create server-side signature verification logic (`src/lib/ckb/auth.ts`)
- `[x]` Update listings endpoint to require signature validation (`src/app/api/listings/route.ts`)
- `[x]` Update chat room endpoints to validate caller's signature (`src/app/api/chat/rooms/route.ts`)
- `[x]` Update chat messages endpoint to check caller's signature (`src/app/api/chat/rooms/[id]/messages/route.ts`)
- `[x]` Write tests to verify auth helper (`tests/auth.test.ts`)
