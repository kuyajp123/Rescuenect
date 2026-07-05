import { Button } from '@heroui/react';
import { Mail, Wrench } from 'lucide-react';
import React from 'react';

const Maintenance: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4 text-center">
      <div className="mb-8 rounded-full bg-primary/10 p-6">
        <Wrench className="h-16 w-16 text-primary animate-pulse" />
      </div>
      
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        We'll be right back.
      </h1>
      
      <p className="mx-auto mb-8 max-w-lg text-lg text-default-500">
        We're currently performing some scheduled maintenance to improve your experience. 
        We apologize for the inconvenience and appreciate your patience.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          as="a" 
          href="mailto:reserveexample@gmail.com" 
          color="primary" 
          variant="shadow"
          startContent={<Mail className="w-4 h-4" />}
          size="lg"
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
};

export default Maintenance;
