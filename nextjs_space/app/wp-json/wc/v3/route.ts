
import { NextResponse } from 'next/server';

// WooCommerce API v3 root endpoint
// This returns API information and available routes
export async function GET() {
  return NextResponse.json({
    namespace: 'wc/v3',
    routes: {
      '/wc/v3': {
        namespace: 'wc/v3',
        methods: ['GET'],
        endpoints: [
          {
            methods: ['GET'],
            args: {
              namespace: {
                required: false,
                default: 'wc/v3'
              },
              context: {
                required: false,
                default: 'view'
              }
            }
          }
        ],
        _links: {
          self: [
            {
              href: 'https://basketballgearstore.abacusai.app/wp-json/wc/v3'
            }
          ]
        }
      },
      '/wc/v3/products': {
        namespace: 'wc/v3',
        methods: ['GET', 'POST'],
        endpoints: [
          {
            methods: ['GET'],
            args: {}
          },
          {
            methods: ['POST'],
            args: {}
          }
        ],
        _links: {
          self: [
            {
              href: 'https://basketballgearstore.abacusai.app/wp-json/wc/v3/products'
            }
          ]
        }
      },
      '/wc/v3/products/(?P<id>[\\d]+)': {
        namespace: 'wc/v3',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        _links: {
          self: [
            {
              href: 'https://basketballgearstore.abacusai.app/wp-json/wc/v3/products/(?P<id>[\\d]+)'
            }
          ]
        }
      }
    },
    _links: {
      up: [
        {
          href: 'https://basketballgearstore.abacusai.app/wp-json/'
        }
      ]
    }
  });
}
