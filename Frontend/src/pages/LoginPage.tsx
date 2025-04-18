import React from 'react'
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import { ThemeSwitcher } from '@/pages/ThemeSwitcher'
import SecondaryButton from '@/components/SecondaryButton'

const LoginPage = () => {
  return (
    <div className="bg-bg dark:bg-bg h-full w-full text-content_text dark:text-content_text flex items-center justify-center">
      <SecondaryButton 
      onPress={() => {
        window.open(`${VITE_BACKEND_URL}/auth/google`, '_self');
      }}
      >Google login
      </SecondaryButton>
    </div>
  )
}

export default LoginPage