import React from 'react'
import {Card, CardBody} from "@heroui/react";

const Test = () => {
  return (
    <div className='container flex justify-around items-center bg-bg dark:bg-bg mx-auto p-4 h-64 w-full'
    // bg-gradient-to-br from-[#14723C] to-[#00A35A]'
    // style={{
    //   background: "linear-gradient(to bottom right, #14723C 0%, #00A35A 90%, #00A35A 100%)",
    // }}
    >
        <Card className="w-[400px] mx-auto bg-bg_hover dark:bg-bg_hover">
            <CardBody>
                <p className=''>Make beautiful websites regardless of your design experience.</p>
            </CardBody>
        </Card> 
        <div className='h-auto w-auto p-10 bg-hover_card dark:bg-hover_card'>
            <p className='dark:text-content_text text-content_text'>plain card </p>
        </div>
    </div>
  )
}

export default Test