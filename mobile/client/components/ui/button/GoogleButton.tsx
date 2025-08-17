import React from 'react'
import { GoogleButtonComponent } from './Button'
import { signInWithPopup, signInWithCredential, GoogleAuthProvider } from "firebase/auth";

const GoogleButton = () => {
  return (
    <GoogleButtonComponent
      onPress={() => console.log('Google Button Pressed')}
    />
  )
}

export default GoogleButton