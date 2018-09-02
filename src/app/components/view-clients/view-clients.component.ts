import { Component, OnInit, ViewChild } from '@angular/core';
import {Router} from '@angular/router';
import {NgbTypeahead, NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {Observable, Subject, merge} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import { FlashMessagesService } from 'angular2-flash-messages';
import { DatabaseService } from "../../services/database.service";
import { ValidateService } from "../../services/validate.service";
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-view-clients',
  templateUrl: './view-clients.component.html',
  styleUrls: ['./view-clients.component.css']
})
export class ViewClientsComponent implements OnInit {

  columns = [];

  clients : any[];
  selectedClient : any;
  companyNames:  any[];
  phone : String;
  phones=[];
  modalReference :any;
  email : any;
  confirm = false;
  idUser : any;

  @ViewChild('instance') instance: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map(term => (term === '' ? this.companyNames
        : this.companyNames.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 10))
    );
  }

  constructor(private router : Router,
  private dbService : DatabaseService,
  private validateService : ValidateService,
  private modalService : NgbModal,
  private flashMessage : FlashMessagesService,
  private authService : AuthService) { }

  ngOnInit() {

    this.dbService.getClients().subscribe(data=>{
      this.clients=data[0] 
  })

  let names = [];
  let companies = [];
    this.dbService.getCompanies().subscribe(data=>{
      companies = data;
      companies.forEach(function(value){
        names.push(value.Name)
      })
      this.companyNames = names;
    })
    this.idUser=this.authService.user.idUser;

    if(this.authService.user.Type == 'Admin'){
      this.columns=['Name', 'Gender', 'Email', 'Status', 'Company', 'Website', 'createdBy'];
    }

    else{
      this.columns=['Name', 'Gender', 'Email', 'Status', 'Company', 'Website'];
    }

}

onClick(client, content){
  this.selectedClient=client;
  this.dbService.getPhones(client).subscribe(data=>{
    data.forEach(value=>{
      this.phones.push(value.PhoneNumber)
    })
  })
  console.log(this.phones);
  this.modalReference=this.modalService.open(content);
}

onAdd(){
  this.phones.push(this.phone)
  this.phone=null
}

onDelete(phone){
  let index = this.phones.indexOf(phone)
  let array;
  if(index>-1){
   array= this.phones.splice(index, 1)
  }

  console.log(array)
}

onConfirm(){
  this.confirm=true;
}

onSubmit(){
let exists;
  if(this.companyNames.includes(this.selectedClient.Company)){
    exists=true;
  }

  let client = {
    idClient : this.selectedClient.idClient,
    name : this.selectedClient.Name,
    email : this.selectedClient.Email,
    gender : this.selectedClient.Gender,
    status : this.selectedClient.Status,
    phones : this.phones,
    companyName : this.selectedClient.Company,
    companyWebsite : this.selectedClient.Website,
    exists : exists,
    idUser : this.idUser
  }

  if(!this.validateService.validateClientRegister(client)){
    this.flashMessage.show('Please fill in all fields', {cssClass : 'alert-danger'})
    return false;
  }

  if(!this.validateService.validateEmail(client.email)){
    this.flashMessage.show('Please enter a valid email address', {cssClass: 'alert-danger'})
    return false;
  }

this.dbService.updateClient(client).subscribe(data =>{
  if(data.success){
    this.modalReference.close();
    this.flashMessage.show(data.msg, {cssClass : 'alert-success'})
    this.router.navigate(['clients']);
  }

  else{
    this.modalReference.close();
    this.flashMessage.show(data.msg, {cssClass : 'alert-danger'})
    this.router.navigate(['clients']);
  }
})

}

}
