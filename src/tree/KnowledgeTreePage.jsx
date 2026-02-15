import { useParams } from "react-router-dom";
import TreeOfKnowledge3D from "./TreeOfKnowledge3D";

export default function KnowledgeTreePage() {
  const { treeKey } = useParams();
  return <TreeOfKnowledge3D treeKey={treeKey} />;
}
