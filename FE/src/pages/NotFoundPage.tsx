import notFoundImg from '../assets/404.png';

export const NotFoundPage = () => {

  return (
    <div className="center-screen">
      <div className="flex flex-col items-center ">
        <img
          src={notFoundImg} alt="404 Not Found"
          style={{ width: '700px' }}
        />
      </div>
    </div>
  );
};
