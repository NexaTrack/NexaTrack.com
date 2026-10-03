# NexaTrack — Multi-Courier Logistics Website

A responsive, multi-page logistics/tracking website built with plain HTML, CSS and JavaScript.

## Pages
- `index.html` — Landing page with a six-image hero carousel, tracking form, services, courier network, and CTA.
- `tracking.html` — Shipment tracking search page.
- `dashboard.html` — Shipment detail/dashboard page with timeline, route, package details, documents and status.
- `services.html` — Multi-modal shipping services.
- `contact.html` — Contact/support page.

## Demo behavior
This is a front-end prototype, so tracking is simulated in JavaScript.

Try these demo tracking numbers:
- One protected demo shipment (credentials are required to view details)
- `DHL-784512963`
- `FEDEX-92018374`
- `UPS-1Z84A7`
- `AIR-20261002`

The email field accepts any valid-looking email. A real production version should connect the search form to your backend/carrier APIs and authenticate customer shipment data server-side.

## Run
Open `index.html` directly in a browser, or serve the folder with any static web server.


Tracking page: the demo result is displayed in an order-tracking layout inspired by the supplied reference image, while retaining NexaTrack colors, typography, cards and accent styling.
