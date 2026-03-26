import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { LoginRequest } from '../types/auth';

export const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (payload: LoginRequest) => {
            await login(payload);
        },
        onSuccess: () => {
            const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
            navigate(redirectPath, { replace: true });
        },
        onError: () => {
            setErrorMessage('Invalid credentials. Please try again.');
        },
    });

    return (
        <div className="login-page">
            <Card className="login-card">
                <Typography.Title level={2}>Admin Login</Typography.Title>
                <Typography.Paragraph type="secondary">
                    Sign in using your organizational account to continue.
                </Typography.Paragraph>

                {errorMessage ? <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} /> : null}

                <Form<LoginRequest>
                    layout="vertical"
                    onFinish={(values: LoginRequest) => {
                        setErrorMessage(null);
                        mutation.mutate(values);
                    }}
                >
                    <Form.Item label="Email" name="email" rules={[{ required: true }, { type: 'email' }]}>
                        <Input size="large" placeholder="you@company.com" autoComplete="email" />
                    </Form.Item>

                    <Form.Item label="Password" name="password" rules={[{ required: true, min: 6 }]}>
                        <Input.Password size="large" placeholder="Enter password" autoComplete="current-password" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block size="large" loading={mutation.isPending}>
                        Sign in
                    </Button>
                </Form>
            </Card>
        </div>
    );
};
