import React from 'react'
import {Card, CardBody} from "@heroui/react";

const Test = () => {
  return (
    <div className='flex justify-center items-center h-auto w-auto bg-bg dark:bg-bg p-20 border'>
      <Card className='bg-card dark:bg-card dark:shadow-none text-text_color dark:text-text_color_dark'
      radius='md'
      >
        <CardBody>
          <h1 className="text-2xl">System preferences</h1>
          <br />
          <p className='text-xl'>Theme</p>
          <br />
          <p>Dark mode</p>
        </CardBody>
      </Card>
    </div>
  )
}

export default Test