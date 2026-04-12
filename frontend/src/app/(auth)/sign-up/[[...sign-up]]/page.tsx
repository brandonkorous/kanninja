import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata = {
    title: 'kanNINJA — Start a kata',
    description: 'Create an account. Free until you outgrow it.',
};

export default function SignUpPage() {
    return <SignUpForm />;
}
