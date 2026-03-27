import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export const ForbiddenPage = () => {
  return (
    <div className='flex flex-col h-screen'>
      <div className="center-screen bg-black flex-1 ">
        <Result
          status="403"
          title="403"
          subTitle="You do not have permission to access this page."
          extra={
            <Link to="/">
              <Button type="primary">Back to home</Button>
            </Link>
          }
        />
      </div>
    </div>
  );
};
