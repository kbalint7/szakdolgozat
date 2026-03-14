import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  return (
    <div className="flex flex-col items-center p-4">
      <LoginForm />
    </div>
  );
}
