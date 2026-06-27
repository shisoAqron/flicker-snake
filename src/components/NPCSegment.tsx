type Props = {
  index: number;
  isHead: boolean;
};

const NPCSegment = ({ index, isHead }: Props) => {
  return (
    <div
      className={isHead ? "npc-segment npc-head" : "npc-segment"}
      style={{ animationDelay: `${index * 60}ms` }}
    />
  );
};

export default NPCSegment;
