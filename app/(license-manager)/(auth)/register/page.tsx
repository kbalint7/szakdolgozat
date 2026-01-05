import { RegisterForm } from '@/components/register-form';

export default async function RegisterPage() {
  return (
    <div className="flex flex-col items-center p-4">
      <RegisterForm />
    </div>
  );
}
