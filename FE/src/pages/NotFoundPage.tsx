import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="center-screen">
      <Result
        status="404"
        title="404"
        subTitle="Page not found."
        extra={
          <Link to="/">
            <Button type="primary">Go Home</Button>
          </Link>
        }
      />
    </div>
  );
};
