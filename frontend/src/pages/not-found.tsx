import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';

/**
 * 404 Not Found 页面
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，当前页面不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}
