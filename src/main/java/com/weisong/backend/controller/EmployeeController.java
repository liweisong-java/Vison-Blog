package com.weisong.backend.controller;

import com.weisong.backend.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/emps")
public class EmployeeController {

//    @Autowired
//    EmployeeMapper employeeMapper;

    @ResponseBody
    @GetMapping(value = "/list")
    public String getEmployeeList(){
//        return employeeMapper.selectAllEmp();
//        model.addAttribute("employeeList", emp
        return "123";
    }
}