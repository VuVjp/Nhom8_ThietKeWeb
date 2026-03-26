import { Alert, Empty, Spin } from 'antd';

interface StatusViewProps {
  isLoading?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyDescription?: string;
}

export const StatusView = ({ isLoading, errorMessage, isEmpty, emptyDescription }: StatusViewProps) => {
  if (isLoading) {
    return (
      <div className="center-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (errorMessage) {
    return <Alert type="error" message={errorMessage} showIcon />;
  }

  if (isEmpty) {
    return <Empty description={emptyDescription} />;
  }

  return null;
};
