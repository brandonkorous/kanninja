import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata = {
    title: 'kanNINJA — Reset password',
    description: 'Reset your password. We\'ll send a six-digit code.',
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />;
}
