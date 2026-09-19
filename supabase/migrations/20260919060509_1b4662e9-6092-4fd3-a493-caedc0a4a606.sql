INSERT INTO public.skills (name, category, description) VALUES
 ('Python','Technical','General purpose programming'),
 ('React','Technical','Frontend UI library'),
 ('TypeScript','Technical','Typed JavaScript'),
 ('SQL','Technical','Relational querying'),
 ('Java','Technical','Backend programming'),
 ('Node.js','Technical','Server side JavaScript'),
 ('Machine Learning','Technical','Model building and evaluation'),
 ('Model Deployment','Technical','Serving models in production'),
 ('Data Visualization','Technical','Charts and dashboards'),
 ('Cloud Infrastructure','Technical','AWS/GCP provisioning'),
 ('UX Research','Product','User interviews and usability testing'),
 ('Interaction Design','Product','Flows, states and prototypes'),
 ('Design Systems','Product','Reusable component libraries'),
 ('Product Analytics','Product','Funnels, retention and metrics'),
 ('Product Strategy','Product','Positioning and roadmap choices'),
 ('Business Analysis','Product','Requirements and process mapping'),
 ('Project Management','People','Scope, schedule and delivery'),
 ('Leadership','People','Direction setting and accountability'),
 ('Mentoring','People','Growing other people capability'),
 ('Communication','People','Clear written and verbal exchange'),
 ('Team Coordination','People','Aligning people across work'),
 ('Problem Solving','People','Structured resolution of issues'),
 ('Decision Making','People','Choosing under uncertainty'),
 ('Strategic Thinking','People','Long horizon reasoning'),
 ('Stakeholder Management','People','Managing expectations across groups'),
 ('People Management','People','Managing performance and growth'),
 ('Performance Management','People','Feedback and review cycles'),
 ('Customer Understanding','Product','Empathy for customer needs'),
 ('Ownership','People','Seeing work through end to end'),
 ('Creativity','People','Generating novel approaches');

INSERT INTO public.employees (id, name, email, department, job_title, location, joining_date, profile_summary, is_demo) VALUES
 ('11111111-1111-4111-8111-000000000001','Arjun Kumar','arjun.kumar@demo.talentiq.app','Engineering','Software Developer','Chennai','2021-06-14','Full-stack developer who has grown from feature work into coordinating small delivery teams.',true),
 ('11111111-1111-4111-8111-000000000002','Priya Sharma','priya.sharma@demo.talentiq.app','Design','UX Designer','Bengaluru','2020-02-03','Designer focused on research-led product work and a shared design system.',true),
 ('11111111-1111-4111-8111-000000000003','Rahul Verma','rahul.verma@demo.talentiq.app','Data','Data Analyst','Hyderabad','2022-01-10','Analyst who turns messy operational data into decisions leaders act on.',true),
 ('11111111-1111-4111-8111-000000000004','Meera Iyer','meera.iyer@demo.talentiq.app','Engineering','Senior Software Developer','Chennai','2018-08-20','Senior engineer with a track record of stabilising platforms and coaching newer engineers.',true),
 ('11111111-1111-4111-8111-000000000005','Daniel Fernandes','daniel.fernandes@demo.talentiq.app','Product','Associate Product Manager','Mumbai','2022-09-05','APM working closely with engineering on internal tooling adoption.',true),
 ('11111111-1111-4111-8111-000000000006','Sneha Nair','sneha.nair@demo.talentiq.app','Data','Machine Learning Engineer','Bengaluru','2021-11-15','ML engineer building recommendation and forecasting models.',true),
 ('11111111-1111-4111-8111-000000000007','Vikram Singh','vikram.singh@demo.talentiq.app','Engineering','QA Engineer','Pune','2019-04-01','Quality engineer who introduced automated regression coverage across two products.',true),
 ('11111111-1111-4111-8111-000000000008','Aisha Khan','aisha.khan@demo.talentiq.app','Marketing','Marketing Analyst','Delhi','2023-03-13','Marketing analyst bridging campaign data and customer research.',true);

INSERT INTO public.employee_skills (employee_id, skill_id, proficiency, confidence, source, evidence)
SELECT e.id, s.id, v.prof, v.conf, v.src, v.ev
FROM (VALUES
 ('11111111-1111-4111-8111-000000000001','Python',4,0.92,'Resume','Primary language across two internal services'),
 ('11111111-1111-4111-8111-000000000001','React',4,0.9,'Project','Built the internal HR dashboard frontend'),
 ('11111111-1111-4111-8111-000000000001','SQL',4,0.88,'Project','Reporting queries for customer analytics platform'),
 ('11111111-1111-4111-8111-000000000001','TypeScript',3,0.8,'Project','Migrated dashboard to typed components'),
 ('11111111-1111-4111-8111-000000000001','Problem Solving',4,0.82,'Achievement','Resolved recurring release blockers'),
 ('11111111-1111-4111-8111-000000000002','UX Research',4,0.9,'Resume','Ran 40+ usability sessions'),
 ('11111111-1111-4111-8111-000000000002','Interaction Design',5,0.93,'Project','Owned onboarding redesign'),
 ('11111111-1111-4111-8111-000000000002','Design Systems',4,0.86,'Project','Created shared component library'),
 ('11111111-1111-4111-8111-000000000002','Communication',4,0.84,'Achievement','Presented research readouts to leadership'),
 ('11111111-1111-4111-8111-000000000003','SQL',5,0.94,'Resume','Daily analytical querying'),
 ('11111111-1111-4111-8111-000000000003','Data Visualization',4,0.9,'Project','Built operations reporting suite'),
 ('11111111-1111-4111-8111-000000000003','Business Analysis',4,0.85,'Project','Mapped order fulfilment process'),
 ('11111111-1111-4111-8111-000000000003','Python',3,0.78,'Learning','Completed analytics automation course'),
 ('11111111-1111-4111-8111-000000000004','Java',5,0.95,'Resume','Core platform services'),
 ('11111111-1111-4111-8111-000000000004','Cloud Infrastructure',4,0.87,'Project','Led migration to managed Kubernetes'),
 ('11111111-1111-4111-8111-000000000004','Mentoring',4,0.9,'Achievement','Mentored four engineers through promotion'),
 ('11111111-1111-4111-8111-000000000004','Team Coordination',4,0.85,'Project','Coordinated a 9 person platform programme'),
 ('11111111-1111-4111-8111-000000000005','Product Analytics',3,0.8,'Project','Adoption funnel for internal tools'),
 ('11111111-1111-4111-8111-000000000005','Stakeholder Management',4,0.83,'Achievement','Aligned three departments on tooling rollout'),
 ('11111111-1111-4111-8111-000000000005','Communication',4,0.86,'Resume','Wrote product briefs and release notes'),
 ('11111111-1111-4111-8111-000000000006','Machine Learning',5,0.94,'Resume','Forecasting and recommendation models'),
 ('11111111-1111-4111-8111-000000000006','Python',5,0.95,'Resume','Primary modelling language'),
 ('11111111-1111-4111-8111-000000000006','Model Deployment',3,0.7,'Project','Shipped one batch scoring pipeline'),
 ('11111111-1111-4111-8111-000000000007','Problem Solving',4,0.88,'Project','Root caused flaky release suite'),
 ('11111111-1111-4111-8111-000000000007','Ownership',4,0.85,'Achievement','Drove regression coverage to 80%'),
 ('11111111-1111-4111-8111-000000000007','SQL',3,0.75,'Project','Test data verification queries'),
 ('11111111-1111-4111-8111-000000000008','Product Analytics',3,0.78,'Project','Campaign attribution reporting'),
 ('11111111-1111-4111-8111-000000000008','Customer Understanding',4,0.84,'Project','Ran customer interview programme'),
 ('11111111-1111-4111-8111-000000000008','Communication',4,0.86,'Resume','Campaign narrative and messaging')
) AS v(emp, skill, prof, conf, src, ev)
JOIN public.employees e ON e.id = v.emp::uuid
JOIN public.skills s ON s.name = v.skill;

INSERT INTO public.projects (employee_id, title, description, role, technologies, outcomes, start_date, end_date) VALUES
 ('11111111-1111-4111-8111-000000000001','Internal HR Dashboard','Self-service dashboard replacing manual HR reporting.','Lead developer, coordinated a 5 person team','{React,TypeScript,Python}','Delivered in 8 weeks; manual reporting effort cut by 60%.','2024-01-15','2024-03-12'),
 ('11111111-1111-4111-8111-000000000001','Customer Analytics Platform','Event pipeline and reporting layer for customer behaviour.','Backend developer','{Python,SQL}','Reduced report turnaround from days to minutes.','2023-04-01','2023-09-30'),
 ('11111111-1111-4111-8111-000000000002','Onboarding Redesign','End to end redesign of first-run experience.','Design owner','{Figma}','Activation improved across two pilot cohorts.','2024-02-01','2024-06-20'),
 ('11111111-1111-4111-8111-000000000002','Design System v2','Shared components and documentation for four product teams.','Design systems lead','{Figma,Storybook}','Adopted by four teams; design review time halved.','2023-05-10','2023-12-01'),
 ('11111111-1111-4111-8111-000000000003','Operations Reporting Suite','Daily operations dashboards for regional managers.','Analyst','{SQL,Looker}','Standardised metrics across five regions.','2023-08-01','2024-01-31'),
 ('11111111-1111-4111-8111-000000000004','Platform Migration','Move core services onto managed Kubernetes.','Technical lead of a 9 person programme','{Java,Terraform,Kubernetes}','Deployment failures reduced by 70%.','2023-02-01','2023-11-15'),
 ('11111111-1111-4111-8111-000000000005','Tooling Adoption Programme','Drove internal adoption of new workflow tools.','Associate product manager','{Amplitude}','Weekly active usage tripled in two quarters.','2024-01-08','2024-07-01'),
 ('11111111-1111-4111-8111-000000000006','Demand Forecasting Model','Regional demand forecasts for supply planning.','ML engineer','{Python,scikit-learn}','Forecast error reduced by 18%.','2023-09-01','2024-04-30'),
 ('11111111-1111-4111-8111-000000000007','Automated Regression Suite','Automated the release regression pack.','QA owner','{Playwright,TypeScript}','Release testing time cut from 3 days to 4 hours.','2023-03-01','2023-10-20'),
 ('11111111-1111-4111-8111-000000000008','Customer Insight Programme','Interview and survey programme feeding campaign strategy.','Programme analyst','{Dovetail,SQL}','Produced quarterly customer insight reports.','2024-02-01','2024-08-15');

INSERT INTO public.achievements (employee_id, title, description, impact, date) VALUES
 ('11111111-1111-4111-8111-000000000001','Mentored two junior developers','Paired weekly on code review and debugging practice.','Both reached independent feature delivery in one quarter.','2024-05-10'),
 ('11111111-1111-4111-8111-000000000001','Took ownership of project delivery','Stepped in to run standups and unblock the team.','Project delivered on the original date.','2024-03-12'),
 ('11111111-1111-4111-8111-000000000002','Research practice adopted company-wide','Documented a repeatable usability testing process.','Three teams adopted the process.','2024-04-02'),
 ('11111111-1111-4111-8111-000000000003','Decision support for regional planning','Built the model leadership used for staffing decisions.','Informed a quarterly staffing plan.','2024-02-18'),
 ('11111111-1111-4111-8111-000000000004','Grew four engineers','Structured mentoring across two teams.','Four promotions within 18 months.','2024-01-30'),
 ('11111111-1111-4111-8111-000000000005','Cross-department alignment','Ran the working group for tooling rollout.','Three departments agreed a single rollout plan.','2024-06-11'),
 ('11111111-1111-4111-8111-000000000006','Forecast accuracy improvement','Reworked feature engineering for seasonality.','18% error reduction sustained over two quarters.','2024-04-30'),
 ('11111111-1111-4111-8111-000000000007','Release confidence programme','Introduced automated regression gating.','Escaped defects down by half.','2023-11-05'),
 ('11111111-1111-4111-8111-000000000008','Customer insight cadence','Established quarterly insight reviews.','Adopted by marketing and product.','2024-08-15');

INSERT INTO public.certifications (employee_id, name, issuer, issue_date, expiry_date) VALUES
 ('11111111-1111-4111-8111-000000000001','AWS Certified Developer Associate','Amazon Web Services','2023-07-12','2026-07-12'),
 ('11111111-1111-4111-8111-000000000002','Nielsen Norman UX Certification','NN/g','2022-10-04',NULL),
 ('11111111-1111-4111-8111-000000000003','Google Data Analytics Certificate','Google','2022-05-20',NULL),
 ('11111111-1111-4111-8111-000000000004','Certified Kubernetes Administrator','CNCF','2023-03-15','2026-03-15'),
 ('11111111-1111-4111-8111-000000000006','TensorFlow Developer Certificate','Google','2023-01-18',NULL);

INSERT INTO public.learning_records (employee_id, course, provider, skills_gained, completion_date) VALUES
 ('11111111-1111-4111-8111-000000000001','Leading Without Authority','Coursera','{Leadership,Team Coordination}','2024-06-01'),
 ('11111111-1111-4111-8111-000000000001','Advanced SQL for Analytics','Udemy','{SQL}','2023-08-14'),
 ('11111111-1111-4111-8111-000000000002','Product Thinking for Designers','Maven','{Product Strategy,Customer Understanding}','2024-03-22'),
 ('11111111-1111-4111-8111-000000000003','Business Analysis Foundations','LinkedIn Learning','{Business Analysis,Decision Making}','2023-12-09'),
 ('11111111-1111-4111-8111-000000000004','Engineering Management Essentials','Reforge','{People Management,Performance Management}','2024-02-27'),
 ('11111111-1111-4111-8111-000000000005','Product Analytics Deep Dive','Amplitude Academy','{Product Analytics}','2024-05-16'),
 ('11111111-1111-4111-8111-000000000006','Machine Learning in Production','DeepLearning.AI','{Model Deployment}','2024-07-08'),
 ('11111111-1111-4111-8111-000000000007','Test Automation Architecture','Test Automation University','{Ownership}','2023-09-30'),
 ('11111111-1111-4111-8111-000000000008','Customer Research Methods','Coursera','{Customer Understanding,Communication}','2024-04-19');

INSERT INTO public.talent_insights (employee_id, capability, confidence, evidence, explanation, explore) VALUES
 ('11111111-1111-4111-8111-000000000001','Leadership',0.78,
  '{"Coordinated a 5-person project on the Internal HR Dashboard","Mentored 2 junior developers","Took ownership of project delivery","Helped resolve team blockers"}',
  'We identified potential leadership capability because project history shows team coordination, mentoring and ownership of delivery rather than individual feature work alone.',
  '{Project Management,People Leadership,Product Management}'),
 ('11111111-1111-4111-8111-000000000001','Mentoring',0.74,
  '{"Weekly pairing with two junior developers","Both mentees reached independent delivery"}',
  'Repeated, structured support of other engineers appears across achievements and project notes, which suggests mentoring is a potential strength.',
  '{Technical Coaching,Team Lead}'),
 ('11111111-1111-4111-8111-000000000002','Research',0.81,
  '{"Ran 40+ usability sessions","Documented a repeatable research process adopted by three teams"}',
  'Potential research capability is suggested by the volume of user sessions and the fact that the documented method was reused by other teams.',
  '{User Research Lead,Product Discovery}'),
 ('11111111-1111-4111-8111-000000000002','Product Thinking',0.69,
  '{"Owned onboarding redesign with activation outcomes","Completed Product Thinking for Designers"}',
  'Outcome framing in design work plus deliberate product learning suggests potential product thinking capability.',
  '{Product Management,Product Design Lead}'),
 ('11111111-1111-4111-8111-000000000003','Business Analysis',0.76,
  '{"Mapped order fulfilment process","Standardised metrics across five regions"}',
  'Work described in projects goes beyond reporting into process and definition work, which suggests potential business analysis capability.',
  '{Business Analyst,Product Operations}'),
 ('11111111-1111-4111-8111-000000000003','Decision Making',0.66,
  '{"Built the model used for a quarterly staffing plan"}',
  'Analysis feeding a leadership staffing decision suggests comfort supporting decisions under uncertainty.',
  '{Analytics Lead,Strategy}'),
 ('11111111-1111-4111-8111-000000000004','People Leadership',0.84,
  '{"Mentored four engineers to promotion","Technical lead of a 9 person programme","Completed Engineering Management Essentials"}',
  'Sustained growth of other engineers, programme level coordination and deliberate management learning together suggest strong potential for a people leadership role.',
  '{Engineering Manager,Technical Lead}'),
 ('11111111-1111-4111-8111-000000000005','Stakeholder Management',0.72,
  '{"Ran the cross-department tooling working group","Aligned three departments on a rollout plan"}',
  'Alignment work across departments suggests potential stakeholder management capability beyond the current scope of the role.',
  '{Product Manager,Programme Management}'),
 ('11111111-1111-4111-8111-000000000006','Ownership',0.7,
  '{"Reworked feature engineering and sustained the improvement for two quarters"}',
  'Following a model through from change to sustained production outcome suggests potential ownership capability.',
  '{ML Lead,Platform Engineering}'),
 ('11111111-1111-4111-8111-000000000007','Problem Solving',0.79,
  '{"Root caused a flaky release suite","Cut release testing from 3 days to 4 hours"}',
  'Diagnosis of a long standing systemic issue, rather than symptom fixes, suggests potential strength in structured problem solving.',
  '{SDET,Release Engineering}'),
 ('11111111-1111-4111-8111-000000000008','Customer Understanding',0.75,
  '{"Ran a customer interview programme","Established quarterly insight reviews adopted by two departments"}',
  'Direct customer contact combined with insight adoption by other teams suggests potential customer understanding capability.',
  '{Product Marketing,Product Research}');

INSERT INTO public.recommendations (employee_id, type, title, description, reason, related_skill, related_role) VALUES
 ('11111111-1111-4111-8111-000000000001','course','First-Time Manager Fundamentals','Six week programme covering delegation, feedback and one-to-ones.','Recommended because people management is required for your target Engineering Manager path.','People Management','Engineering Manager'),
 ('11111111-1111-4111-8111-000000000001','project','Lead the next internal tooling workstream','Take delivery ownership of a small cross-team workstream.','Recommended because your evidence of coordination is strong but limited to one project.','Team Coordination','Technical Lead'),
 ('11111111-1111-4111-8111-000000000001','mentoring','Join the engineering mentoring circle','Structured mentoring of two new joiners for one quarter.','Recommended to deepen the mentoring signal already detected in your history.','Mentoring','Technical Lead'),
 ('11111111-1111-4111-8111-000000000002','course','Product Analytics Deep Dive','Funnels, retention and experiment readouts.','Recommended because product analytics is a gap for the Product Manager role you match.','Product Analytics','Product Manager'),
 ('11111111-1111-4111-8111-000000000003','course','Strategic Thinking for Analysts','Framework driven long horizon analysis.','Recommended because strategic thinking is required for the Analytics Lead path.','Strategic Thinking','Analytics Lead'),
 ('11111111-1111-4111-8111-000000000006','course','Model Deployment at Scale','Serving, monitoring and rollback of production models.','Recommended because model deployment is your largest gap for senior ML roles.','Model Deployment','Senior ML Engineer');

INSERT INTO public.internal_roles (id, title, department, description, required_skills, preferred_skills, experience_required, is_demo) VALUES
 ('22222222-2222-4222-8222-000000000001','Senior Software Developer','Engineering','Own delivery of significant features and raise engineering standards across the team.','{Python,React,SQL,Problem Solving}','{TypeScript,Mentoring}',4,true),
 ('22222222-2222-4222-8222-000000000002','Technical Lead','Engineering','Lead a small team technically while staying close to the code.','{Team Coordination,Mentoring,Problem Solving,Cloud Infrastructure}','{Leadership,Decision Making}',6,true),
 ('22222222-2222-4222-8222-000000000003','Engineering Manager','Engineering','Manage engineers, performance and delivery for one team.','{People Management,Performance Management,Strategic Thinking,Communication}','{Leadership,Project Management}',7,true),
 ('22222222-2222-4222-8222-000000000004','Product Manager','Product','Own a product area from discovery through delivery.','{Product Analytics,Product Strategy,Stakeholder Management,Communication}','{Customer Understanding,Problem Solving}',4,true),
 ('22222222-2222-4222-8222-000000000005','Analytics Lead','Data','Set analytical direction and standards across business areas.','{SQL,Data Visualization,Business Analysis,Strategic Thinking}','{Decision Making,Communication}',5,true),
 ('22222222-2222-4222-8222-000000000006','Senior Machine Learning Engineer','Data','Take models from prototype into reliable production systems.','{Machine Learning,Python,Model Deployment}','{Cloud Infrastructure,Ownership}',5,true);

INSERT INTO public.role_skills (role_id, skill_id, required_level, importance)
SELECT r.id, s.id, 4, 'required' FROM public.internal_roles r
JOIN LATERAL unnest(r.required_skills) AS rs(name) ON true
JOIN public.skills s ON s.name = rs.name;

INSERT INTO public.role_skills (role_id, skill_id, required_level, importance)
SELECT r.id, s.id, 3, 'preferred' FROM public.internal_roles r
JOIN LATERAL unnest(r.preferred_skills) AS ps(name) ON true
JOIN public.skills s ON s.name = ps.name
ON CONFLICT (role_id, skill_id) DO NOTHING;