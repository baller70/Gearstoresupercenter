import fetch from 'node-fetch';

async function testWooCommerceAPI() {
  try {
    // First, sign in to get a session
    const signInRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john@doe.com',
        password: 'password123',
        csrfToken: 'test',
        callbackUrl: 'http://localhost:3000/admin/woocommerce',
        json: true
      })
    });

    console.log('Sign in response status:', signInRes.status);
    const cookies = signInRes.headers.get('set-cookie');
    console.log('Cookies:', cookies);

    if (!cookies) {
      console.error('❌ No session cookie received');
      return;
    }

    // Now try to generate credentials
    const generateRes = await fetch('http://localhost:3000/api/admin/woocommerce/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    });

    console.log('\n📝 Generate credentials response status:', generateRes.status);
    const result = await generateRes.json();
    console.log('Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWooCommerceAPI();
