import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import { notFound } from "next/navigation";
import { careerLabOwner } from "../../../lib/career-lab-owner";
import { LAB_FIXTURES } from "../../../lib/career-lab";
import { CAREER_MODEL_VERSION } from "../../../lib/career-guidance-results";
import CareerLab from "./career-lab";
export const dynamic="force-dynamic";
export async function generateMetadata() { return translatedMetadata({title:"Career Guidance · laboratorio interno",robots:{index:false,follow:false}}); }
export default async function CareerLabPage(){
 if(!await careerLabOwner()) notFound();
 return <LocalizedContent><CareerLab fixtures={LAB_FIXTURES} version={CAREER_MODEL_VERSION}/></LocalizedContent>;
}


