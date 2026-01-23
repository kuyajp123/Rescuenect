import { useEffect } from 'react';
import htmlContent from '@/assets/legalTerms/PrivacyPolicy.html?raw';

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = 'Privacy Policy';
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default PrivacyPolicy;
