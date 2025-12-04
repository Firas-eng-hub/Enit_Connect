export class Offer{
    title: string;
    type : string;
    createdat : string;
    start : string;
    end : string;
    content : string;
    docs : any[] = [];
    companyid : string;
    constructor(){
        this.companyid = localStorage.getItem('company_id');
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        this.createdat = day + "/" + month + "/" + year;
    }
}