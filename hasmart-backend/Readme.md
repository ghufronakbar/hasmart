# WAHA

## Specs

Dari WAHA sendiri mempertahankan websocket seperti Whatsapp Web pada umumnya, ketika diaktifkan webhook di konfigurasi, WAHA akan mengirimkan payload ke app kita (tergantung mau subscribe event apa saja), jadi seperti forward

`WAHA subscribe websocket Whatsapp server oleh Puppeter -> Forward ke App`

## Resource

- HTTP Client (Axios/Fetch)
- Jika FIFO bisa tambah queue (record job di database) dengan batching

## Kind of Image

- `waha:latest`: Menggunakan Puppeteer (Chrome). Lebih stabil tapi file size besar.
- `waha:core`: Menggunakan library ringan (tanpa Chrome), biasanya berbasis socket langsung (seperti library Baileys). Lebih ringan RAM, tapi kadang lebih rentan terdeteksi/ban.

## Additional

- **Resiko Banned (Block)**: Karena ini unofficial, selalu ada risiko nomor diblokir oleh pihak WhatsApp jika terdeteksi melakukan spam/blast berlebihan. Gunakan delay antar pesan.

- **Masalah "Log Out" Sendiri**: Karena berbasis WhatsApp Web, jika HP utama mati total terlalu lama atau ada update besar dari WhatsApp Web, sesi bisa terputus dan butuh scan QR ulang manual. Diperlukan monitoring (health check) pada servicenya.

- **Media Handling**: Mengirim gambar/file via WAHA membutuhkan setup tambahan agar file bisa dibaca oleh container (mounting volume) atau mengirim file dalam format Base64 (bisa berat di network).

- **Multi-Device Support**: WAHA support MD (Multi-Device), jadi HP tidak harus selalu online, tapi tetap harus aktif sesekali untuk sinkronisasi token keamanan.

# Meta API Whatsapp Business

## Plain Text

![Screenshot Plain Text](./docs/screenshot_plain_text.png)

### CURL

```bash
curl -i -X POST \
  https://graph.facebook.com/v22.0/929171606952026/messages \
  -H 'Authorization: Bearer EAAUir5G8pOoBQhm13jpgteZC6BGZB4AUKZAXgZCN9feOoonVjhClYz9fVcUAaoHOMZCVE1rNQlZB1ZB5ZCAyeomk4uQoZBNA2lonGrQFOqpi2xvGApZA27EUBUKWSXFQWVbkRgZA65nX3IkPpcIaNk4QUvzkZBwaUaQIqu2RsaJLP3CucabuX4OGNSVqcWQsOrig1Xysa053PHemXZA9nNtmmjXEZAYKcrv9c50mBWeWoNhfxnBnFAp0pTOkdFiBZBOMt5VMG3i998mGGGdW5KUZCgVFZAUmwPwqIT8ilVUZAtMGYx10sZD' \
  -H 'Content-Type: application/json' \
  -d '{ "messaging_product": "whatsapp", "to": "6285156031385", "type": "template", "template": { "name": "jaspers_market_plain_text_v1", "language": { "code": "en_US" } } }'
```

### Webhook Payload 1

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1564026177973487",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551983720",
              "phone_number_id": "929171606952026"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNjI4NTE1NjAzMTM4NRUCABEYEjIyRTdGNTJDRENGNjFEMzREQgA=",
                "status": "delivered",
                "timestamp": "1769146745",
                "recipient_id": "6285156031385",
                "recipient_logical_id": "244048631738500",
                "conversation": {
                  "id": "12ee2d0c6c879f04b380dd01a39a11f0",
                  "origin": {
                    "type": "marketing"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "PMP",
                  "category": "marketing",
                  "type": "regular"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Webhook Payload 2

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1564026177973487",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551983720",
              "phone_number_id": "929171606952026"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNjI4NTE1NjAzMTM4NRUCABEYEjIyRTdGNTJDRENGNjFEMzREQgA=",
                "status": "delivered",
                "timestamp": "1769146745",
                "recipient_id": "6285156031385",
                "recipient_logical_id": "244048631738500",
                "conversation": {
                  "id": "12ee2d0c6c879f04b380dd01a39a11f0",
                  "origin": {
                    "type": "marketing"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "PMP",
                  "category": "marketing",
                  "type": "regular"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## Interactive CTAs

![Screenshot Interactive CTAs](./docs/screenshot_interactive_ctas.png)

### CURL

```bash
curl -i -X POST \
  https://graph.facebook.com/v22.0/929171606952026/messages \
  -H 'Authorization: Bearer EAAUir5G8pOoBQhm13jpgteZC6BGZB4AUKZAXgZCN9feOoonVjhClYz9fVcUAaoHOMZCVE1rNQlZB1ZB5ZCAyeomk4uQoZBNA2lonGrQFOqpi2xvGApZA27EUBUKWSXFQWVbkRgZA65nX3IkPpcIaNk4QUvzkZBwaUaQIqu2RsaJLP3CucabuX4OGNSVqcWQsOrig1Xysa053PHemXZA9nNtmmjXEZAYKcrv9c50mBWeWoNhfxnBnFAp0pTOkdFiBZBOMt5VMG3i998mGGGdW5KUZCgVFZAUmwPwqIT8ilVUZAtMGYx10sZD' \
  -H 'Content-Type: application/json' \
  -d '{ "messaging_product": "whatsapp", "to": "6285156031385", "type": "template", "template": { "name": "jaspers_market_image_cta_v1", "language": { "code": "en_US" }, "components": [{ "type": "header", "parameters": [{ "type": "image", "image": { "link": "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=1530053877871776" } }] }] } }'
```

### Webhook Payload 1

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1564026177973487",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551983720",
              "phone_number_id": "929171606952026"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNjI4NTE1NjAzMTM4NRUCABEYEkIzNzM2RjQ1OTE5NDI5MDFFNAA=",
                "status": "sent",
                "timestamp": "1769146186",
                "recipient_id": "6285156031385",
                "recipient_logical_id": "244048631738500",
                "conversation": {
                  "id": "b3ae88317786e5da8981c9b4b5b8014b",
                  "expiration_timestamp": "1769146186",
                  "origin": {
                    "type": "marketing"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "PMP",
                  "category": "marketing",
                  "type": "regular"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Webhook Payload 2

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1564026177973487",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551983720",
              "phone_number_id": "929171606952026"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNjI4NTE1NjAzMTM4NRUCABEYEkIzNzM2RjQ1OTE5NDI5MDFFNAA=",
                "status": "delivered",
                "timestamp": "1769146187",
                "recipient_id": "6285156031385",
                "recipient_logical_id": "244048631738500",
                "conversation": {
                  "id": "b3ae88317786e5da8981c9b4b5b8014b",
                  "origin": {
                    "type": "marketing"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "PMP",
                  "category": "marketing",
                  "type": "regular"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## Media Card Carousel

![Screenshot Media Card Carousel](./docs/screenshot_media_card_carousel.png)

### CURL

```bash
curl -i -X POST \
 https://graph.facebook.com/v22.0/929171606952026/messages \
 -H 'Authorization: Bearer EAAUir5G8pOoBQhm13jpgteZC6BGZB4AUKZAXgZCN9feOoonVjhClYz9fVcUAaoHOMZCVE1rNQlZB1ZB5ZCAyeomk4uQoZBNA2lonGrQFOqpi2xvGApZA27EUBUKWSXFQWVbkRgZA65nX3IkPpcIaNk4QUvzkZBwaUaQIqu2RsaJLP3CucabuX4OGNSVqcWQsOrig1Xysa053PHemXZA9nNtmmjXEZAYKcrv9c50mBWeWoNhfxnBnFAp0pTOkdFiBZBOMt5VMG3i998mGGGdW5KUZCgVFZAUmwPwqIT8ilVUZAtMGYx10sZD' \
 -H 'Content-Type: application/json' \
 -d '{ "messaging_product": "whatsapp", "to": "6285156031385", "type": "template", "template": { "name": "jaspers_market_media_carousel_v1", "language": { "code": "en_US" }, "components": [{ "type": "carousel", "cards": [{ "card_index": 0, "components": [{ "type": "header", "parameters": [{ "type": "image", "image": { "link": "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=1389202275965231" } }] }] }, { "card_index": 1, "components": [{ "type": "header", "parameters": [{ "type": "image", "image": { "link": "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=3255815791260974" } }] }] }] }] } }'
```

### Webhook Payload 1

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1564026177973487",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551983720",
              "phone_number_id": "929171606952026"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNjI4NTE1NjAzMTM4NRUCABEYEjJFM0Q0NjE1ODk3MEZFM0JCOAA=",
                "status": "sent",
                "timestamp": "1769146421",
                "recipient_id": "6285156031385",
                "recipient_logical_id": "244048631738500",
                "conversation": {
                  "id": "1ce15964e4cc51038221b55d3d7c1ded",
                  "expiration_timestamp": "1769146421",
                  "origin": {
                    "type": "marketing"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "PMP",
                  "category": "marketing",
                  "type": "regular"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Webhook Payload 2

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1564026177973487",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551983720",
              "phone_number_id": "929171606952026"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNjI4NTE1NjAzMTM4NRUCABEYEjJFM0Q0NjE1ODk3MEZFM0JCOAA=",
                "status": "delivered",
                "timestamp": "1769146422",
                "recipient_id": "6285156031385",
                "recipient_logical_id": "244048631738500",
                "conversation": {
                  "id": "1ce15964e4cc51038221b55d3d7c1ded",
                  "origin": {
                    "type": "marketing"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "PMP",
                  "category": "marketing",
                  "type": "regular"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## Order Confirmation

![Screenshot Order Confirmation](./docs/screenshot_order_confirmation.png)

### CURL

```bash

curl -i -X POST \
 https://graph.facebook.com/v22.0/929171606952026/messages \
 -H 'Authorization: Bearer EAAUir5G8pOoBQhm13jpgteZC6BGZB4AUKZAXgZCN9feOoonVjhClYz9fVcUAaoHOMZCVE1rNQlZB1ZB5ZCAyeomk4uQoZBNA2lonGrQFOqpi2xvGApZA27EUBUKWSXFQWVbkRgZA65nX3IkPpcIaNk4QUvzkZBwaUaQIqu2RsaJLP3CucabuX4OGNSVqcWQsOrig1Xysa053PHemXZA9nNtmmjXEZAYKcrv9c50mBWeWoNhfxnBnFAp0pTOkdFiBZBOMt5VMG3i998mGGGdW5KUZCgVFZAUmwPwqIT8ilVUZAtMGYx10sZD' \
 -H 'Content-Type: application/json' \
 -d '{ "messaging_product": "whatsapp", "to": "6285156031385", "type": "template", "template": { "name": "jaspers_market_order_confirmation_v1", "language": { "code": "en_US" }, "components": [{ "type": "body", "parameters": [{ "type": "text", "text": "John Doe" }, { "type": "text", "text": "123456" }, { "type": "text", "text": "Jan 23, 2026" }] }] } }'
```

### Webhook Payload 1

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1564026177973487",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551983720",
              "phone_number_id": "929171606952026"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNjI4NTE1NjAzMTM4NRUCABEYEkZCQkIyMUE1MUY3RjI2QzdFMgA=",
                "status": "sent",
                "timestamp": "1769146587",
                "recipient_id": "6285156031385",
                "recipient_logical_id": "244048631738500",
                "conversation": {
                  "id": "5584830347cc75d1c3e71913e11467c5",
                  "expiration_timestamp": "1769146588",
                  "origin": {
                    "type": "utility"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "PMP",
                  "category": "utility",
                  "type": "regular"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Webhook Payload 2

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1564026177973487",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551983720",
              "phone_number_id": "929171606952026"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNjI4NTE1NjAzMTM4NRUCABEYEkZCQkIyMUE1MUY3RjI2QzdFMgA=",
                "status": "delivered",
                "timestamp": "1769146588",
                "recipient_id": "6285156031385",
                "recipient_logical_id": "244048631738500",
                "conversation": {
                  "id": "5584830347cc75d1c3e71913e11467c5",
                  "origin": {
                    "type": "utility"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "PMP",
                  "category": "utility",
                  "type": "regular"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

# Trade Off

## Meta Official

### Verifikasi Business:

a. Verifikasi Facebook Business Manager (Legalitas perusahaan, ex: NIB, Tax, dll.)

### Chats:

a. **Aturan 24 Jam**

Jika user itdak membalas lebih dari 24 jam, **tidak bisa** mengirim pesan ke user lagi (dengan catatan `*b*`).

b. **Wajib Template**

Percakapn baru harus menggunakan **Message Template (HSM)**.

c. **Approval**

Template harus ada approval terlebih dahulu.

### Cost

a. **Biaya per Percakapan (Session)**

Cost ditagih setiap 24 jam **(bukan per pesan/bubble chat)**, melainkan per sesi.

b. **Category Conversation**

**Business yang mengirim pesan duluan**

- Marketing (Paling mahal)
  Estimasi: Rp 600 - Rp 765 per conversation
  ex: `Halo Andi, ada diskon di toko kami`

- Utility (Menengah)
  Estimasi: Rp 300 - Rp 340 per conversation
  ex: `Pesanan #123 sedang dikirim`

- Authentication (Utility/Menengah)
  Estimasi: Rp 300 - Rp 340 per conversation
  ex: `OTP: 123456`

**User yang chat duluan**
Estimasi: Rp 260 - Rp 290 per conversation
Gratis 1000 conversation pertama setiap bulan untuk akun WhatsappBusiness
