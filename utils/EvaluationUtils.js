
const Mongoose = require("mongoose");
const OrganizationSchema = require('../model/OrganizationSchema');
const PaymentReleasesSchema = require('../model/PaymentReleasesSchema');
const moment = require("moment");
const userSchema = require("../model/UserSchema");

exports.GetEmployeeEvaluationYears = async (userId) => {
  console.log("inside:GetEmployeeEvaluationYears");
  const UserDomain = await userSchema.findOne({ "_id": userId });
  let {JoiningDate} = UserDomain;
  let joiningMoment = moment(JoiningDate);
  const Organization = await OrganizationSchema.findOne({ "_id": UserDomain.Organization });
  let {StartMonth,EndMonth,EvaluationPeriod} = Organization;
  console.log(`${StartMonth},${EndMonth},${EvaluationPeriod}`);
  var currentMoment = moment();
  let yearsStartFrom=joiningMoment;
  if(EvaluationPeriod === "FiscalYear"){
    var currentMonth = parseInt(joiningMoment.format('M'));
    console.log(`${currentMonth} <= ${StartMonth}`)
    if(currentMonth <= StartMonth){
      yearsStartFrom = joiningMoment.subtract(1, 'years');
    }
  }else if(EvaluationPeriod === "CalendarYear"){
    currentMoment = moment().add(1, 'years');;
  }
  console.log("yearsStartFrom>"+yearsStartFrom.format("YYYY"));
  let yearsList = [];
  yearsStartFrom = Number(yearsStartFrom.format("YYYY"));
  let yearsEndValue = Number(currentMoment.format("YYYY"));
  let index=0;
  while(yearsStartFrom<=yearsEndValue){
    yearsList[index]=yearsStartFrom;
    yearsStartFrom++;
    index++;
  }
  console.log(`yearsList :`+yearsList)
  return yearsList;
}
exports.GetOrgEvaluationYear = async (organizationId) => {
    const Organization = await OrganizationSchema.findOne({"_id":Mongoose.Types.ObjectId(organizationId)});
    let {StartMonth,EndMonth,EvaluationPeriod} = Organization;
    StartMonth = parseInt(StartMonth);
    let currentMoment = moment();
    let evaluationStartMoment;
    let evaluationEndMoment
    if(EvaluationPeriod === "FiscalYear"){
      var currentMonth = parseInt(currentMoment.format('M'));
      console.log(`${currentMonth} <= ${StartMonth}`)
      if(currentMonth <= StartMonth){
        evaluationStartMoment = moment().month(StartMonth-1).startOf('month').subtract(1, 'years');
        evaluationEndMoment = moment().month(StartMonth-2).endOf('month');
        console.log(`${evaluationStartMoment.format("MM DD,YYYY")} = ${evaluationEndMoment.format("MM DD,YYYY")}`);
      }else{
        evaluationStartMoment = moment().month(StartMonth-1).startOf('month');
        evaluationEndMoment = moment().month(StartMonth-2).endOf('month').add(1, 'years');
        console.log(`${evaluationStartMoment.format("MM DD,YYYY")} = ${evaluationEndMoment.format("MM DD,YYYY")}`);
      }
    }else if(EvaluationPeriod === "CalendarYear"){
      evaluationStartMoment = moment().startOf('month');
      evaluationEndMoment = moment().month(0).endOf('month').add(1, 'years');
    }
    return evaluationStartMoment.format("YYYY");

};


exports.getOrganizationStartAndEndDates = async (organizationId) => {
  const Organization = await OrganizationSchema.findOne({"_id":Mongoose.Types.ObjectId(organizationId)});
  let {StartMonth,EndMonth,EvaluationPeriod} = Organization;
    StartMonth = parseInt(StartMonth);
    let currentMoment = moment();
    let evaluationStartMoment;
    let evaluationEndMoment
    if(EvaluationPeriod === "FiscalYear"){
      var currentMonth = parseInt(currentMoment.format('M'));
      console.log(`${currentMonth} <= ${StartMonth}`)
      if(currentMonth <= StartMonth){
        evaluationStartMoment = moment().month(StartMonth-1).startOf('month').subtract(1, 'years');
        evaluationEndMoment = moment().month(StartMonth-2).endOf('month');
        console.log(`${evaluationStartMoment.format("MM DD,YYYY")} = ${evaluationEndMoment.format("MM DD,YYYY")}`);
      }else{
        evaluationStartMoment = moment().month(StartMonth-1).startOf('month');
        evaluationEndMoment = moment().month(StartMonth-2).endOf('month').add(1, 'years');
        console.log(`${evaluationStartMoment.format("MM DD,YYYY")} = ${evaluationEndMoment.format("MM DD,YYYY")}`);
      }
    }else if(EvaluationPeriod === "CalendarYear"){
      evaluationStartMoment = moment().startOf('year');
      evaluationEndMoment = moment().endOf('year');
    }
    return {
      start:evaluationStartMoment,
      end:evaluationEndMoment
    }

};

  exports.getEvaluationsAvailable = async (clientId) => {
    let evaluationYear = await EvaluationUtils.GetOrgEvaluationYear(clientId);
    console.log(`evaluationYear = ${evaluationYear}`);
    var payments = await PaymentReleasesSchema.find({
        'Status': 'Complete',
        'Organization': Mongoose.Types.ObjectId(clientId),
        'ActivationDate': { $lt: moment().add(1, "day").startOf("day").toDate() }
    })
    var pgs = await KpiFormRepo.find({
        'Company': Mongoose.Types.ObjectId(clientId),
        'EvaluationYear': evaluationYear
    })

    var evaluations = await EvaluationRepo.find({
        'Company': Mongoose.Types.ObjectId(req.clientId),
        'EvaluationYear': evaluationYear.toString()
    })
    var pgsCount = pgs.length;
    var evalsCount = 0;
    evaluations.forEach(evaluation => {
      evalsCount = evalsCount+evaluation.Employees.length;
    });
  var total = 0;
  payments.forEach(payment => {
    var employeesCount = 0;
    var licencesCount = 0;
    var isLicenseCount = false;
    if (payment.UserType === 'License') {
      if (payment.Type != 'Adhoc') {
        licencesCount = payment.Range.substring(payment.Range.indexOf('-')+1,payment.Range.length);
        isLicenseCount = true;
      } else {
        employeesCount = employeesCount + payment.NoOfEmployees;
      }
    } else {
      employeesCount = employeesCount + payment.NoOfEmployees;
    }
    if(licencesCount){
      total = total + licencesCount;
    }else{
      total = total + employeesCount;
    }
  });
  var available = available - (pgsCount + evalsCount);
  var availablePercentage = (available/total)*100;
  result = {};
  result.available = available;
  result.availablePercentage = availablePercentage;
  return result;

}
