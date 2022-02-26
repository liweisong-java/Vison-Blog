package com.weisong.backend.controller;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.weisong.backend.entities.Employee;
import com.weisong.backend.service.EmployeeService;
import com.weisong.backend.util.Result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sun.applet.Main;

import java.sql.SQLOutput;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping(value = "/emps")
@CrossOrigin(origins = "http://localhost:9527", maxAge = 3600)
public class EmployeeController{
    Logger logger = LoggerFactory.getLogger(EmployeeController.class);
    @Autowired
    EmployeeService employeeService;

    static String field="";

    @ResponseBody
    @GetMapping(value = "/listArticle")
    public Result getEmployeeList(){
        logger.info("begin getEmployeeList");
        return Result.success(employeeService.getAllEmp());
    }

    @ResponseBody
    @PostMapping(value = "/list")
    public Result<Map<String, Object>> employeePageList(@RequestBody Map map){
        Result result = new Result();
        Integer pageIndex=(Integer)map.get("pageIndex");
        Integer pageSize=(Integer)map.get("pageSize");
        PageHelper.startPage(pageIndex,pageSize);
        List<Employee> list = employeeService.getAllEmp();
        PageInfo pageInfo=new PageInfo<>(list);
        return Result.success(Result.pageInfoToMap(pageInfo));
    }

    @ResponseBody
    @RequestMapping(value = "/add",method = RequestMethod.POST)
    public Result addEmployee(@RequestBody @Validated Employee employee, BindingResult result){
        logger.info("begin addEmployee");
        if (result.hasErrors()){
//              获取校验的错误结果
            result.getFieldErrors().forEach((item)->{
                field = item.getField();
            });
            return Result.formatError(1, field);
        }
        employeeService.insertEmp(employee);
        return Result.success();
    }

    @ResponseBody
    @RequestMapping(value = "/deleteEmp",method = RequestMethod.POST)
    public Result deleteEmpById(@RequestBody Employee employee){
        logger.info("begin deleteEmpById");
        employeeService.deleteEmpById(employee.getEmp_Id());
        return Result.success();
    }

    @ResponseBody
    @RequestMapping(value = "/changeEnable",method = RequestMethod.POST)
    public Result changeEnableById(@RequestBody Employee employee){
        logger.info("begin changeEnableById");
        return Result.success(employeeService.changeEnableById(employee.getEmp_Id()));
    }

    @ResponseBody
    @RequestMapping("/checkUser")
    public Result checkUser(@RequestParam("lastName")String lastName){
        //先判断用户名是否是合法的表达式;
        String regx = "(^[a-zA-Z0-9_-]{6,16}$)|(^[\u2E80-\u9FFF]{2,5})";
        if(!lastName.matches(regx)){
            //前端需要的
            return Result.nameFormatError(100);
        }

        //数据库用户名重复校验
        boolean b = employeeService.checkUser(lastName);
        if(b){
            return Result.success();
        }else{
            return Result.repetitionError();
        }

    }

}
