package com.weisong.backend.controller;

import com.weisong.backend.entities.Employee;
import com.weisong.backend.service.EmployeeService;
import com.weisong.backend.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/emps")
@CrossOrigin(origins = "http://localhost:9527", maxAge = 3600)
public class EmployeeController {
    @Autowired
    EmployeeService employeeService;

    static String field="";

    @ResponseBody
    @GetMapping(value = "/listEmp")
    public Result getEmployeeList(){
        List<Employee> allEmp = employeeService.getAllEmp();
        return Result.success(allEmp);
    }

    @ResponseBody
    @RequestMapping(value = "/add",method = RequestMethod.POST)
    public Result addEmployee(@RequestBody @Validated Employee employee, BindingResult result){
        if (result.hasErrors()){
//              获取校验的错误结果
            result.getFieldErrors().forEach((item)->{
                field = item.getField();
            });
            return Result.error(1, field);
        }
        employeeService.insertEmp(employee);
        return Result.success();
    }

    @ResponseBody
    @RequestMapping(value = "/deleteEmp/{emp_id}",method = RequestMethod.POST)
    public Result deleteEmpById(@RequestBody @PathVariable("emp_id")Integer emp_id){
        employeeService.deleteEmpById(emp_id);
        return Result.success();
    }
    
}