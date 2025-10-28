
import { Order, Product, OrderItem } from '@prisma/client';

/**
 * Map our Order to WooCommerce Order format
 */
export function mapOrderToWooCommerce(
  order: Order & { orderItems: OrderItem[] },
  products: Product[]
): any {
  const lineItems = order.orderItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    
    return {
      id: item.id,
      name: product?.name || 'Unknown Product',
      product_id: item.productId,
      quantity: item.quantity,
      subtotal: item.price.toString(),
      subtotal_tax: '0.00',
      total: (item.price * item.quantity).toString(),
      total_tax: '0.00',
      price: item.price.toString(),
      sku: product?.sku || product?.id || '',
      meta_data: [
        {
          key: 'size',
          value: item.size || ''
        },
        {
          key: 'color',
          value: item.color || ''
        }
      ]
    };
  });
  
  return {
    id: order.id,
    parent_id: 0,
    number: order.id,
    order_key: `wc_order_${order.id}`,
    created_via: 'rest-api',
    version: '1.0.0',
    status: mapOrderStatus(order.status),
    currency: 'USD',
    date_created: order.createdAt.toISOString(),
    date_created_gmt: order.createdAt.toISOString(),
    date_modified: order.updatedAt.toISOString(),
    date_modified_gmt: order.updatedAt.toISOString(),
    discount_total: '0.00',
    discount_tax: '0.00',
    shipping_total: '0.00',
    shipping_tax: '0.00',
    cart_tax: '0.00',
    total: order.total.toString(),
    total_tax: '0.00',
    prices_include_tax: false,
    customer_id: order.userId || 0,
    customer_ip_address: '',
    customer_user_agent: '',
    customer_note: '',
    billing: {
      first_name: order.billingName?.split(' ')[0] || '',
      last_name: order.billingName?.split(' ').slice(1).join(' ') || '',
      company: '',
      address_1: order.billingAddress || '',
      address_2: '',
      city: order.billingCity || '',
      state: order.billingState || '',
      postcode: order.billingZip || '',
      country: order.billingCountry || 'US',
      email: order.shippingEmail || '',
      phone: ''
    },
    shipping: {
      first_name: order.shippingName?.split(' ')[0] || '',
      last_name: order.shippingName?.split(' ').slice(1).join(' ') || '',
      company: '',
      address_1: order.shippingAddress || '',
      address_2: '',
      city: order.shippingCity || '',
      state: order.shippingState || '',
      postcode: order.shippingZip || '',
      country: order.shippingCountry || 'US'
    },
    payment_method: 'stripe',
    payment_method_title: 'Credit Card',
    transaction_id: order.id,
    date_paid: order.createdAt.toISOString(),
    date_paid_gmt: order.createdAt.toISOString(),
    date_completed: order.status === 'DELIVERED' ? order.updatedAt.toISOString() : null,
    date_completed_gmt: order.status === 'DELIVERED' ? order.updatedAt.toISOString() : null,
    cart_hash: '',
    meta_data: [],
    line_items: lineItems,
    tax_lines: [],
    shipping_lines: [
      {
        id: 1,
        method_title: 'Standard Shipping',
        method_id: 'standard',
        total: '0.00',
        total_tax: '0.00',
        taxes: []
      }
    ],
    fee_lines: [],
    coupon_lines: [],
    refunds: [],
    currency_symbol: '$'
  };
}

/**
 * Map our order status to WooCommerce status
 */
function mapOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'SHIPPED': 'completed',
    'DELIVERED': 'completed',
    'CANCELLED': 'cancelled'
  };
  
  return statusMap[status] || 'pending';
}

/**
 * Map WooCommerce status to our status
 */
export function mapWooCommerceStatus(wcStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'processing': 'PROCESSING',
    'on-hold': 'PENDING',
    'completed': 'SHIPPED',
    'cancelled': 'CANCELLED',
    'refunded': 'CANCELLED',
    'failed': 'CANCELLED'
  };
  
  return statusMap[wcStatus] || 'PENDING';
}

/**
 * Map our Product to WooCommerce Product format
 */
export function mapProductToWooCommerce(product: Product): any {
  return {
    id: product.id,
    name: product.name,
    slug: product.name.toLowerCase().replace(/\s+/g, '-'),
    permalink: `https://yourstore.com/products/${product.id}`,
    date_created: product.createdAt.toISOString(),
    date_created_gmt: product.createdAt.toISOString(),
    date_modified: product.updatedAt.toISOString(),
    date_modified_gmt: product.updatedAt.toISOString(),
    type: 'simple',
    status: 'publish',
    featured: product.featured,
    catalog_visibility: 'visible',
    description: product.description,
    short_description: product.description?.substring(0, 100) || '',
    sku: product.sku || product.id,
    price: product.price.toString(),
    regular_price: product.price.toString(),
    sale_price: '',
    date_on_sale_from: null,
    date_on_sale_from_gmt: null,
    date_on_sale_to: null,
    date_on_sale_to_gmt: null,
    price_html: `<span class="amount">$${product.price}</span>`,
    on_sale: false,
    purchasable: true,
    total_sales: 0,
    virtual: false,
    downloadable: false,
    downloads: [],
    download_limit: -1,
    download_expiry: -1,
    external_url: '',
    button_text: '',
    tax_status: 'taxable',
    tax_class: '',
    manage_stock: true,
    stock_quantity: product.stock,
    stock_status: product.stock > 0 ? 'instock' : 'outofstock',
    backorders: 'no',
    backorders_allowed: false,
    backordered: false,
    sold_individually: false,
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    shipping_required: true,
    shipping_taxable: true,
    shipping_class: '',
    shipping_class_id: 0,
    reviews_allowed: true,
    average_rating: '0.00',
    rating_count: 0,
    related_ids: [],
    upsell_ids: [],
    cross_sell_ids: [],
    parent_id: 0,
    purchase_note: '',
    categories: [
      {
        id: 1,
        name: product.category,
        slug: product.category.toLowerCase().replace(/\s+/g, '-')
      }
    ],
    tags: [],
    images: product.images.map((img, index) => ({
      id: index,
      date_created: product.createdAt.toISOString(),
      date_created_gmt: product.createdAt.toISOString(),
      date_modified: product.updatedAt.toISOString(),
      date_modified_gmt: product.updatedAt.toISOString(),
      src: img.startsWith('http') ? img : `https://i.ytimg.com/vi/ygErZGWkeYk/maxresdefault.jpg`,
      name: product.name,
      alt: product.name
    })),
    attributes: [
      {
        id: 1,
        name: 'Size',
        position: 0,
        visible: true,
        variation: true,
        options: product.sizes
      },
      {
        id: 2,
        name: 'Color',
        position: 1,
        visible: true,
        variation: true,
        options: product.colors
      }
    ],
    default_attributes: [],
    variations: [],
    grouped_products: [],
    menu_order: 0,
    meta_data: [
      {
        key: 'design_id',
        value: product.designId || ''
      },
      {
        key: 'placement',
        value: product.placement || 'chest'
      }
    ]
  };
}
