import { indiaTime } from "../lib/departments";
import React from "react";
import { Link } from "../lib/context";
import { whatsappUrl, safeUrl } from "../lib/utils";
export function ClassifiedContact({ item }) {
  const a = item.attributes || {},
    job = item.category_id === "jobs",
    event = item.category_id === "happenings";
  const application = safeUrl(a[job ? "Application URL" : "Booking URL"]);
  const official = safeUrl(a["Official notice URL"]);
  const closed =
    job && a["Application deadline"]
      ? Date.now() > Date.parse(a["Application deadline"] + "T23:59:59+05:30")
      : event && a["Event ends"]
        ? Date.now() > indiaTime(a["Event ends"])
        : false;
  const wa =
    !item.sample && !closed && item.seller?.whatsapp_enabled
      ? whatsappUrl(
          item.seller?.whatsapp,
          `Hi, I’m interested in ${item.title}. ${location.origin}/listing/${item.id}`,
        )
      : "";
  return (
    <section className="purchase-panel">
      <h3>
        {job
          ? "Apply or enquire"
          : event
            ? "Event information"
            : "Contact about this property"}
      </h3>
      {closed ? (
        <p>This {job ? "vacancy has closed" : "event has ended"}.</p>
      ) : (
        <>
          <p>
            {job
              ? "Contact the recruiter directly."
              : event
                ? "Confirm availability and entry details with the organiser."
                : "Arrange a viewing or ask about availability."}
          </p>
          {wa && (
            <a
              className="button primary"
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
            >
              {job
                ? "Contact recruiter"
                : event
                  ? "Contact organiser"
                  : "Enquire"}{" "}
              on WhatsApp
            </a>
          )}
          {application?.startsWith("https://") && (
            <a
              className="button"
              href={application}
              target="_blank"
              rel="noopener noreferrer"
            >
              {job ? "Apply on external website" : "Visit booking website"} ↗
            </a>
          )}
        </>
      )}
      {official?.startsWith("https://") && (
        <a href={official} target="_blank" rel="noopener noreferrer">
          Read official notice ↗
        </a>
      )}
      {job && item.seller?.slug && (
        <Link to={"/recruiter/" + item.seller.slug}>
          Recruiter profile & vacancies →
        </Link>
      )}
      <small>
        {job
          ? "An enquiry does not submit an application."
          : event
            ? "Enquiries do not reserve tickets."
            : "Enquiries do not reserve or purchase a property."}
      </small>
    </section>
  );
}
