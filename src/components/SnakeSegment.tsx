type Props = {
  index: number;
  isHead: boolean;
};

const SnakeSegment = ({ index, isHead }: Props) => {
  return (
    <div
      className={isHead ? "snake-segment snake-head" : "snake-segment"}
      style={{ animationDelay: `${index * 60}ms` }}
    />
  );
};

export default SnakeSegment;
