import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import notFoundImg from '../../public/404.png';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="center-screen">
      <div className="flex flex-col items-center ">
          <img
            src={notFoundImg} alt="404 Not Found"
            style={{ width: '700px' }}
          />
          <Button onClick={() => navigate('/')} type="primary">Go Home</Button>
      </div>
    </div>
  );
};
