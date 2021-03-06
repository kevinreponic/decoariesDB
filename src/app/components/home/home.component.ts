import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router'
import { AuthService } from "../../services/auth.service";
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private authService : AuthService, private router : Router) { }
  admin = false;

  ngOnInit() {
  if(this.authService.user==undefined){
    this.router.navigate(['login'])
  }

  else if(this.authService.user.Type == 'Admin'){
    this.admin=true;
  }
  
  }

}
