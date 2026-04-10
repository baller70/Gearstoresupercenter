import { redirect } from 'next/navigation';

// =============================================================================
// REDIRECT: Old /design-studio route now redirects to new /design designer
// The new merchandise designer at /design provides a better user experience
// with 4-step workflow, product templates, color customization, and more.
// =============================================================================
export default function DesignStudioRedirect() {
  redirect('/design');
}
