import * as React from "react";
import Test from "./setting/Test";

// 1. import `HeroUIProvider` component
import {HeroUIProvider} from "@heroui/system";

export default function App() {
  // 2. Wrap HeroUIProvider at the root of your app
  return (
    <HeroUIProvider>
      <Test />
    </HeroUIProvider>
  );
}
