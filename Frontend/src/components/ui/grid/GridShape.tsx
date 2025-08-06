const GridShape = () => {
  return (
    <>
      <div className="absolute right-0 top-0 -z-1 w-full max-w-[250px] xl:max-w-[450px]">
        <img src="/public/images/shapes/grid-01.svg" alt="grid" />
      </div>
      <div className="absolute bottom-0 left-0 -z-1 w-full max-w-[250px] rotate-180 xl:max-w-[450px]">
        <img src="/public/images/shapes/grid-01.svg" alt="grid" />
      </div>
    </>
  );
}

export default GridShape;