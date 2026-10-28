# Cartaholics
The body moved on. The cloth did not.

A one-person archive of clothes. Pickup in Brisbane / Meanjin.

## How to run

Install, build, then start on port 3000.

## Env

See .env in this folder. Desk lock defaults to 1947.
PayPal client id is optional. Empty means rehearsal checkout: slip created, no money moves.

## Seller

Bookmark /desk and /dispatch. PIN 1947. Not in the customer menu.
On a phone, open /desk, photograph 1 to 6 shots. Cropped to 3:4. Save puts it in /archive.

## Persistence

SQLite: data/cartaholics.db
Photos: public/uploads/
Bag: browser localStorage, key cartaholics-bag.

## Money

AUD as A$. Pickup free. AU 12, NZ 18, rest of world 28.

## Pages

/ /archive /piece/[id] /bag /checkout /order/[id] /shipping /desk /dispatch
