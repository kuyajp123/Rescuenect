import { Button } from '@heroui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fade-in-up">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to <span className="text-brand">Rescuenect</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Let's get your admin account set up. This will only take a minute.
          </p>
        </div>

        <div className="flex justify-center">
          {/* You can add an illustration here if desired */}
          <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/30">
            <span className="text-4xl">👋</span>
          </div>
        </div>

        <Button
          color="primary"
          size="lg"
          className="w-full font-medium"
          endContent={<ArrowRight className="w-4 h-4" />}
          onPress={() => navigate('/address-setup')}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
