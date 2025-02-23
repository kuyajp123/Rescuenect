import React from 'react'
import {Card, CardBody} from "@heroui/react";

const Test = () => {
  return (
    <div className='container flex justify-around items-center bg-bg dark:bg-bg mx-auto p-4 h-64 w-full'>
        <Card className="w-[400px] mx-auto bg-bg_hover dark:bg-bg_hover">
            <CardBody>
                <p className=''>Make beautiful websites regardless of your design experience.</p>
            </CardBody>
        </Card> 
        <div className='h-auto w-auto p-10 bg-secondary_plain dark:bg-secondary_plain'>
            <p className='dark:text-content_text text-content_text'>plain card </p>
        </div>
    </div>
  )
}

export default Test