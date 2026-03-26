import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export const ForbiddenPage = () => {
  return (
    <div className="center-screen">
      <Result
        status="403"
        title="403"
        subTitle="You do not have permission to access this page."
        extra={
          <Link to="/">
            <Button type="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
};
