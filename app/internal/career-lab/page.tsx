import { notFound } from "next/navigation";
import { careerLabOwner } from "../../../lib/career-lab-owner";
import { LAB_FIXTURES } from "../../../lib/career-lab";
import { CAREER_MODEL_VERSION } from "../../../lib/career-guidance-results";
import CareerLab from "./career-lab";
export const dynamic="force-dynamic";
export const metadata={title:"Career Guidance · laboratorio interno",robots:{index:false,follow:false}};
export default async function CareerLabPage(){
 if(!await careerLabOwner()) notFound();
 return <CareerLab fixtures={LAB_FIXTURES} version={CAREER_MODEL_VERSION}/>;
}

