import { Routes, Route } from "react-router-dom";

const Router = () => {
  return (
    <Routes>
      <Route path='/' />
      <Route path='/weather' />
      <Route path='/earthquake' />
      <Route path='/add_notification' />
      <Route path='/add_event' />
      <Route path='/donation' />
      <Route path='/volunteer' />
    </Routes>
  )
}

export default Router