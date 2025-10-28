
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Basketball Factory & Rise as One AAU',
    description: 'Premium basketball apparel and gear',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app',
    home: process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app',
    gmt_offset: '0',
    timezone_string: 'UTC',
    namespaces: [
      'wc/v3',
      'wc/v2',
      'wc/v1',
      'wp/v2'
    ],
    authentication: {
      oauth1: {
        request: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app'}/wc-auth/v1/authorize`,
        authorize: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app'}/wc-auth/v1/authorize`,
        access: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app'}/wc-auth/v1/access_token`,
        version: '1.0a',
      }
    },
    routes: {
      '/wp-json/wc/v3/': {
        namespace: 'wc/v3',
        methods: ['GET'],
        endpoints: [
          {
            methods: ['GET'],
            args: {}
          }
        ],
        _links: {
          self: [
            {
              href: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app'}/wp-json/wc/v3`
            }
          ]
        }
      },
      '/wp-json/wc/v3/products': {
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
              href: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app'}/wp-json/wc/v3/products`
            }
          ]
        }
      },
      '/wp-json/wc/v3/orders': {
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
              href: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app'}/wp-json/wc/v3/orders`
            }
          ]
        }
      }
    },
    _links: {
      help: [
        {
          href: 'https://developer.wordpress.org/rest-api/'
        }
      ],
      'wp:featuredmedia': [
        {
          embeddable: true,
          href: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://basketballgearstore.abacusai.app'}/wp-json/wp/v2/media`
        }
      ],
      curies: [
        {
          name: 'wp',
          href: 'https://api.w.org/{rel}',
          templated: true
        }
      ]
    }
  });
}
