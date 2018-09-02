import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {DatePipe} from "@angular/common";
import { FlashMessagesService } from 'angular2-flash-messages';
import { DatabaseService } from "../../services/database.service";
import { ValidateService } from "../../services/validate.service";

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {

  name : String;
  size : Number;
  cloth : String;
  url : String;
  description : String;

  constructor(private router : Router,
    private datePipe : DatePipe,
    private dbService : DatabaseService,
    private validateService : ValidateService,
    private flashMessage : FlashMessagesService) { }

  ngOnInit() {
  }

    onSubmit(){
      let product = {
        name : this.name,
        size : this.size,
        cloth : this.cloth,
        url : this.url,
        description : this.description
      }

      if(!this.validateService.validateProduct(product)){
        this.flashMessage.show('Please fill in all fields', {cssClass:'alert-danger'})
        return false;
      }

      this.dbService.addProduct(product).subscribe(data=>{
        if(data.success){
          this.flashMessage.show(data.msg, {cssClass : 'alert-success'})
          this.router.navigate(['products'])
        }
        else{
          this.flashMessage.show(data.msg, {cssClass : 'alert-danger'})
          this.router.navigate(['products'])
        }
      })
    }


}